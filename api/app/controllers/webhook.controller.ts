import { Request, Response } from "express";
import axios from "axios";
import { Review, Transaction, Wallet, Transcript, User } from "../db/models";
import { sequelize } from "../db";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { TranscriptAttributes, TranscriptStatus } from "../types/transcript";
import { PR_EVENT_ACTIONS } from "../utils/constants";

import { verify_signature } from "../utils/validate-webhook-signature";
import { parseMdToJSON } from "../helpers/transcript";
import { getTotalWords } from "../utils/review.inference";
import { sendAlert } from "../helpers/sendAlert";
import { cacheTranscript } from "../db/helpers/redis";
import { BaseParsedMdContent } from "../types/transcript";
import { isTranscriptValid } from "../utils/functions";
import { addCreditTransactionQueue } from "../utils/cron";

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

export async function handlePushEvent(req: Request, res: Response) {
  if (!verify_signature(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const pushEvent = req.body;
  if (!pushEvent) {
    return res.status(500).send({
      message: "No push event data found in the request body.",
    });
  }

 const payload = JSON.parse(pushEvent.payload);
  if (!payload) {
    return res.status(500).send({
      message: "No payload found in the request body.",
    });
  }

  const commits = payload.commits;
  if (!commits || !Array.isArray(commits)) {
    return res.status(500).send({
      message: "No commits found in the push event data.",
    });
  }

  try {
    for (const commit of commits) {
      const changedFiles = [
        ...commit.added,
        ...commit.modified,
      ];
      for (const file of changedFiles) {
        const rawUrl = `https://raw.githubusercontent.com/${payload.repository.full_name}/${commit.id}/${file}`;
        //read the file with axios
        const response = await axios.get(rawUrl);
        //check if the file contains the string "transcript"
        
      }
    }
    return res.status(200).json(pushEvent);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save URLs in the database";
    return res.status(500).send({ message });
  }
}
