import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { Review, Transaction, Wallet, Transcript, User } from "../db/models";
import { sequelize } from "../db";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { TranscriptAttributes, TranscriptStatus } from "../types/transcript";
import { PAGE_COUNT, PR_EVENT_ACTIONS } from "../utils/constants";
import { redis } from "../db";
import {
  calculateCreditAmount,
  generateTransactionId,
} from "../utils/transaction";
import { verify_signature } from "../utils/validate-webhook-signature";
import { generateUniqueHash, parseMdToJSON } from "../helpers/transcript";
import { getTotalWords } from "../utils/review.inference";
import { sendAlert } from "../helpers/sendAlert";
import {
  CACHE_EXPIRATION,
  deleteCache,
  resetRedisCachedPages,
} from "../db/helpers/redis";
import { BaseParsedMdContent } from "../types/transcript";
import { json } from "sequelize";

// create a new credit transaction when a review is merged
async function createCreditTransaction(review: Review, amount: number) {
  const dbTransaction = await sequelize.transaction();
  const currentTime = new Date();

  const user = await User.findByPk(review.userId);
  if (!user) throw new Error(`Could not find user with id=${review.userId}`);

  const userWallet = await Wallet.findOne({
    where: { userId: user.id },
  });
  if (!userWallet)
    throw new Error(`Could not get wallet for user with id=${user.id}`);

  const newWalletBalance = userWallet.balance + Math.round(+amount);
  const creditTransaction = {
    id: generateTransactionId(),
    reviewId: review.id,
    walletId: userWallet.id,
    amount: Math.round(+amount),
    transactionType: TRANSACTION_TYPE.CREDIT,
    transactionStatus: TRANSACTION_STATUS.SUCCESS,
    timestamp: currentTime,
  };
  try {
    await Transaction.create(creditTransaction, {
      transaction: dbTransaction,
    });
    await userWallet.update(
      {
        balance: newWalletBalance,
      },
      { transaction: dbTransaction }
    );
    await dbTransaction.commit();
  } catch (error) {
    await dbTransaction.rollback();
    const failedTransaction = {
      ...creditTransaction,
      transactionStatus: TRANSACTION_STATUS.FAILED,
    };
    await Transaction.create(failedTransaction);

    throw error;
  }
}

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

        const creditAmount = await calculateCreditAmount(associatedTranscript);
        await createCreditTransaction(existingReview, creditAmount);

        return res.sendStatus(200);
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
  type: "added" | "modified"
) {
  const changedFiles = [...commit[type]]; // get the files that were added or modified in the commit so we don't have to maintain two separate functions, this is also easily extendable when we want to take care of deleted commits.
  for (const file of changedFiles) {
    const rawUrl = `https://raw.githubusercontent.com/${pushEvent.repository.full_name}/master/${file}`;
    const response: any = await axios.get(rawUrl);
    const mdContent = response.data;
    const jsonContent: BaseParsedMdContent =
      parseMdToJSON<BaseParsedMdContent>(mdContent);
    const transcript_by = jsonContent.transcript_by.toLowerCase();

    function isTranscriptValid(transcript_by: string): boolean {
      return (
        transcript_by.includes("tstbtc") &&
        transcript_by.includes("--needs-review")
      );
    }

    if (!jsonContent) {
      throw new Error(
        "Malformed data: transcript content might not be in the correct format"
      );
    }

    const transcriptHash = generateUniqueHash(jsonContent);
    const totalWords = getTotalWords(jsonContent.body);
    const content = jsonContent;

    if (!transcriptHash || !totalWords) {
      throw new Error(
        "Malformed data: transcript content might not be in the correct format"
      );
    }

    const existingTranscript = await Transcript.findOne({
      where: { transcriptHash: transcriptHash },
    });

    if (existingTranscript && type === "added") {
      throw new Error("transcript already exists");
    }

    if (!isTranscriptValid(transcript_by)) {
      throw new Error(
        "Transcript not from TSTBTC or does not need review - did not queue transcript"
      );
    }

    const transcript: TranscriptAttributes = {
      originalContent: {
        ...content,
        title: content.title.trim() as string,
      },
      content: content,
      transcriptHash,
      transcriptUrl: rawUrl,
      status: TranscriptStatus.queued,
      contentTotalWords: totalWords,
    };

    let transcriptData: any;
    if (type === "added") {
      transcriptData = await Transcript.create(transcript);
    } else if (type === "modified") {
      // Find the existing transcript in the database
      const existingTranscript = await Transcript.findOne({
        where: { transcriptUrl: rawUrl },
      });

      if (!existingTranscript) {
        throw new Error("No transcript found to update");
      }

      // Update the transcript in the database
      await existingTranscript.update(transcript);

      // Invalidate the cache
      const redisTransaction = redis.multi();
      redisTransaction.del(`transcript:${existingTranscript.id}`);
      await redisTransaction.exec();

      transcriptData = existingTranscript;
    }

    // Send alert to Discord
    await sendAlert(
      `Transcript Queued Successfully`,
      transcriptData.originalContent.title
    );

    const redisNewTranscriptTransaction = redis.multi();

    redisNewTranscriptTransaction.sadd("cachedTranscripts", transcriptData.id);

    redisNewTranscriptTransaction.set(
      `transcript:${transcriptData.id}`,
      JSON.stringify(transcriptData),
      "EX",
      CACHE_EXPIRATION
    );

    for (let i = 0; i < PAGE_COUNT; i++) {
      redisNewTranscriptTransaction.del(`transcriptsPage:${i}`);
    }

    await redisNewTranscriptTransaction.exec((err, _results) => {
      if (err) {
        Transcript.destroy({ where: { id: transcriptData.id } });
        throw err;
      }
    });
  }
}

export async function handlePushEvent(req: Request, res: Response) {
  if (!verify_signature(req)) {
    return res.status(401).json("Unauthorized");
  }

  const pushEvent = req.body;
  if (!pushEvent) {
    return res.status(500).json({
      message: "No push event found in the request body.",
    });
  }

  const commits = pushEvent.commits;
  if (!commits) {
    return res.status(500).json({
      message: "No commits found in the request body.",
    });
  }

  try {
    for (const commit of commits) {
      await processCommit(commit, pushEvent, "added");
      await processCommit(commit, pushEvent, "modified");
    }
  } catch (error) {
    // Send error email
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendAlert("Transcript Queue Error/fail", message);
    return res.status(500).json({ message: message });
  }
  return res.status(200).json({ message: "Transcript queued Successfully" });
}
