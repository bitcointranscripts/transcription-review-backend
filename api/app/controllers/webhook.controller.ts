import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { Review, Transaction, Wallet, Transcript, User } from "../db/models";
import { sequelize } from "../db";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { TranscriptAttributes, TranscriptAttributes, TranscriptStatus } from "../types/transcript";
import { PAGE_COUNT, PR_EVENT_ACTIONS } from "../utils/constants";
import { redis } from "../db";

import {
  calculateCreditAmount,
  generateTransactionId,
} from "../utils/transaction";
import { verify_signature } from "../utils/validate-webhook-signature";
import { parseMdToJSON } from "../helpers/transcript";
import { getTotalWords } from "../utils/review.inference";
import { sendAlert } from "../helpers/sendAlert";
import { cacheTranscript } from "../db/helpers/redis";
import { BaseParsedMdContent } from "../types/transcript";
import { isTranscriptValid } from "../utils/functions";

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

async function processCommit(commit: any, pushEvent: any) {
  const changedFiles = [...commit.added];
  for (const file of changedFiles) {
    const rawUrl = `https://raw.githubusercontent.com/${pushEvent.repository.full_name}/master/${file}`;
    const response: AxiosResponse<TSTBTCAttributes> = await axios.get(rawUrl);
    const mdContent = response.data;
    const jsonContent = parseMdToJSON(mdContent);
    const transcript_by = jsonContent.transcript_by.toLowerCase();

    function isTranscriptValid(jsonContent: any): boolean {
      return transcript_by.includes("tstbtc") && transcript_by.includes("--needs-review");
    }

    // Validate jsonContent
    if (!jsonContent) {
      throw new Error("Malformed data: transcript content might not be in the correct format");
    }

    const transcriptHash = generateUniqueHash(jsonContent);
    const totalWords = getTotalWords(jsonContent.body);
    const content = jsonContent;

    // Validate other values
    if (!transcriptHash || !totalWords) {
      throw new Error("Malformed data: transcript content might not be in the correct format");
    }

    const existingTranscript = await Transcript.findOne({
      where: { transcriptHash: transcriptHash },
    });

    if (existingTranscript) {
      throw new Error("transcript already exists");
    }

    if (!isTranscriptValid(jsonContent)) {
      throw new Error("Transcript not from TSTBTC or does not need review - did not queue transcript");
    }

    const transcript: TranscriptAttributes = {
      originalContent: {
        ...content,
        title: content.title.trim(),
      },
      content: content,
      transcriptHash,
      transcriptUrl: rawUrl,
      status: TranscriptStatus.queued,
      contentTotalWords: totalWords,
    };
    
    const transcriptData = await Transcript.create(transcript);

   const redisNewTranscriptTransaction = redis.multi();

    // Add the new transcript's ID to the "cachedTranscripts" set
    redisNewTranscriptTransaction.sadd("cachedTranscripts", transcriptData.id);

    // Cache the new transcript
    redisNewTranscriptTransaction.set(`transcript:${transcriptData.id}`, JSON.stringify(transcriptData), 'EX', CACHE_EXPIRATION);

    // Delete cached pages of transcripts
    for (let i = 0; i < PAGE_COUNT; i++) {
      redisNewTranscriptTransaction.del(`transcriptsPage:${i}`);
    }

    // Execute the Redis transaction
    await redisNewTranscriptTransaction.exec((err, _results) => {
      if (err) {
        // If an error occurred during the transaction, delete the new transcript from the database
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

  try {
    for (const commit of commits) {
      await processCommit(commit, pushEvent);
    }
  } catch (error) {
    return handleError(error, res);
    // Send error email
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendEmail(message);
    return res.status(500).json({ message:message });
  }
  return res.sendStatus(200);
}