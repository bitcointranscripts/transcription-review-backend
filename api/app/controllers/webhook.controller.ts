import { Request, Response } from "express";
import axios from "axios";
import { Review, Transcript } from "../db/models";
import { TranscriptAttributes, TranscriptStatus } from "../types/transcript";
import { PR_EVENT_ACTIONS } from "../utils/constants";

import { verify_signature } from "../utils/validate-webhook-signature";
import { parseMdToJSON } from "../helpers/transcript";
import { getTotalWords } from "../utils/review.inference";
import { sendAlert } from "../helpers/sendAlert";
import { cacheTranscript } from "../db/helpers/redis";
import { BaseParsedMdContent } from "../types/transcript";
import { isProcessableTranscriptFile, isTranscriptNeedingReview } from "../utils/functions";
import { addCreditTransactionQueue } from "../utils/cron";
import { Logger } from "../helpers/logger";
export async function create(req: Request, res: Response) {
  if (!verify_signature(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const pull_request = req.body;
  if (!pull_request) {
    return res.status(500).send({
      message: "No pull request data found in the request body.",
    });
  }

  const action = pull_request.action;
  const isMerged = pull_request.pull_request?.merged;
  const html_url = pull_request.pull_request?.html_url;
  const currentTime = new Date();

  if (!action || !html_url) {
    return res.status(500).send({
      message: "No action or html_url found in the request body.",
    });
  }

  // Check if the PR URL exists in the database
  const existingReview = await Review.findOne({ where: { pr_url: html_url } });

  if (!existingReview) {
    return res.status(404).send({
      message: `Review with pr_url=${html_url} not found`,
    });
  }

  // Check if the action is closed and the PR is merged
  if (action === PR_EVENT_ACTIONS.CLOSED && isMerged) {
    try {
      // PR is merged, update the mergedAt timestamp
      existingReview.mergedAt =
        pull_request.pull_request.merged_at ?? currentTime;
      await existingReview.save();

      // find and update the associated transcript
      const associatedTranscript = await Transcript.findByPk(
        existingReview.transcriptId
      );

      if (associatedTranscript) {
        associatedTranscript.archivedAt = currentTime;
        await associatedTranscript?.save();
        await addCreditTransactionQueue(associatedTranscript, existingReview);

        return res.status(200).send({
          message: `processing credit transaction for review ${existingReview.id}`,
        });
      } else {
        throw new Error("Could not find associated transcript");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "unable to update review or associated transcript";
      return res.status(500).send({
        message,
      });
    }
  } else if (action === PR_EVENT_ACTIONS.CLOSED && !isMerged) {
    try {
      // PR is merged, update the archivedAt timestamp
      existingReview.archivedAt = currentTime;
      await existingReview.save();

      // find and update the associated transcript
      const associatedTranscript = await Transcript.findByPk(
        existingReview.transcriptId
      );

      if (associatedTranscript) {
        associatedTranscript.claimedBy = null;
        associatedTranscript.status = TranscriptStatus.queued;
        await associatedTranscript?.save();
        res.sendStatus(200);
      } else {
        throw new Error("Could not find associated transcript");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "unable to update review or associated transcript";
      return res.status(500).send({
        message,
      });
    }
  }
}

async function processCommit(
  commit: any,
  pushEvent: any,
  type: "added" | "modified",
  branch: string
) {
  const changedFiles = [...commit[type]]; // get the files that were added or modified in the commit so we don't have to maintain two separate functions, this is also easily extendable when we want to take care of deleted commits.
  // Create an array of promises to fetch file contents
  if (changedFiles.length === 0) {
    return;
  }
  const validTranscriptFiles = changedFiles.filter((file) => {
    return isProcessableTranscriptFile(file);
  })

  if (validTranscriptFiles.length === 0) {
    Logger.info("No valid transcript files found");
    return;
  }

  const fetchFilePromises = validTranscriptFiles.map(async (file) => {

    const rawUrl = `https://api.github.com/repos/${pushEvent.repository?.full_name}/contents/${file}?ref=${branch}`;
    try {
      const response = await axios.get(rawUrl, {
        headers: { Accept: "application/vnd.github.v3.raw" },
      });
      return { file, response, rawUrl };
    } catch (error) {
      return { file, error, rawUrl };
    }
  });
  // Fetch file contents concurrently
  const results = await Promise.all(fetchFilePromises);

  // Process each file
  for (const result of results) {
    try {
      if ("error" in result) {
        throw result.error;
      }

      const { response, rawUrl } = result;

      const mdContent = response.data;
      const jsonContent: BaseParsedMdContent =
        parseMdToJSON<BaseParsedMdContent>(mdContent);

      // Validate the content
      if (!jsonContent) {
        throw new Error(
          "Malformed data: transcript content might not be in the correct format"
        );
      }
      const transcript_by = jsonContent.transcript_by

      // Validate the transcript_by before making any DB calls
      if (!isTranscriptNeedingReview(transcript_by)) {
        Logger.info(`Transcript does not need review: ${jsonContent.title}`);
        return;
      }

      const totalWords = getTotalWords(jsonContent.body);
      const content = jsonContent;

      if (!totalWords) {
        throw new Error(
          "Malformed data: transcript content might not be in the correct format"
        );
      }

      const existingTranscript = await Transcript.findOne({
        where: { transcriptUrl: rawUrl },
      });

      if (existingTranscript && type === "added") {
        Logger.info("Transcript needs review, but already exists");
        return;
      }

      const transcript: TranscriptAttributes = {
        originalContent: {
          ...content,
          title: content.title.trim(),
        },
        content: content,
        transcriptHash: "",
        transcriptUrl: rawUrl,
        status: TranscriptStatus.queued,
        contentTotalWords: totalWords,
      };

      let transcriptData: TranscriptAttributes;

      if (type === "added" || (type === "modified" && !existingTranscript)) {
        transcriptData = await Transcript.create(transcript);
        await cacheTranscript(transcriptData);

        // Send alert to Discord
        sendAlert({
          message: "New Transcript Ready for Review!",
          isError: false,
          transcriptTitle: transcriptData.originalContent.title,
          speakers: transcriptData.originalContent.speakers,
          transcriptUrl: transcriptData.transcriptUrl,
          type: "transcript",
        });
      } else if (type === "modified" && existingTranscript) {
        await existingTranscript.update(transcript);
        transcriptData = existingTranscript;
        await cacheTranscript(transcriptData);

        // Send alert to Discord
        sendAlert({
          message: "Transcript modified",
          isError: false,
          transcriptTitle: transcriptData.originalContent.title,
          speakers: transcriptData.originalContent.speakers,
          transcriptUrl: transcriptData.transcriptUrl,
          type: "transcript",
        });
      }
    } catch (error: any) {
      sendAlert({
        message: `Error processing file ${result.file}: ${error.message}`,
        isError: true,
        type: "transcript",
      });
    }
  }
}

// Check if the branch is valid for the current environment
function isValidEnvironmentAndBranch(branch: string, env: string): boolean {
  const allowedBranches = ["master", "staging", "development"];
  if (!allowedBranches.includes(branch)) {
    return false;
  }

  return (
    (branch === "master" && env === "production") ||
    (branch === "staging" && env === "staging") ||
    (branch === "development" && env === "development")
  );
}

// Handle errors and send alerts
async function handleError(error: any, res: Response) {
  const message = error instanceof Error ? error.message : "Unknown error";
  sendAlert({ message, isError: true, type: "transcript" });
  return res.status(500).json({ message: message });
}

// Handle push events from GitHub
export async function handlePushEvent(req: Request, res: Response) {
  if (!verify_signature(req)) {
    return res.status(401).json("Unauthorized");
  }

  const { body: pushEvent } = req;
  if (!pushEvent) {
    return res.status(500).json({
      message: "No push event found in the request body.",
    });
  }

  const { commits, ref } = pushEvent;
  if (!commits) {
    return res.status(500).json({
      message: "No commits found in the request body.",
    });
  }

  const branch = ref.split("/").pop();

  const env = process.env.NODE_ENV as string;

  if (!isValidEnvironmentAndBranch(branch, env)) {
    return res
      .status(400)
      .json({ message: "Invalid branch for the current environment" });
  }
  try {
    const commitPromises = commits.map(async (commit: any) => {
      try {
        await processCommit(commit, pushEvent, "added", branch);
        await processCommit(commit, pushEvent, "modified", branch);
      } catch (error: any) {
        sendAlert({
          message: error.message,
          isError: true,
          type: "transcript",
        });
        res.status(500).json({ message: error.message });
        return { status: "rejected", reason: error.message };
      }
    });
    await Promise.allSettled(commitPromises);
  } catch (error) {
    return handleError(error, res);
  }
  return res.sendStatus(200);
}
