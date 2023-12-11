import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { Review, Transaction, Wallet, Transcript, User } from "../db/models";
import { sequelize } from "../db";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { TSTBTCAttributes, TranscriptStatus } from "../types/transcript";
import { PR_EVENT_ACTIONS } from "../utils/constants";
import {
  calculateCreditAmount,
  generateTransactionId,
} from "../utils/transaction";
import { verify_signature } from "../utils/validate-webhook-signature";
import { convertMdToJSON, generateUniqueHash } from "../helpers/transcript";
import { getTotalWords } from "../utils/review.inference";

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
        associatedTranscript.claimedBy = undefined;
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

  let responseStatus = 200;
  let responseMessage = "success";

  try {
    for (const commit of commits) {
      const changedFiles = [...commit.added, ...commit.modified];
      for (const file of changedFiles) {
        const rawUrl = `https://raw.githubusercontent.com/${pushEvent.repository.full_name}/master/${file}`;
        const response: AxiosResponse<TSTBTCAttributes> = await axios.get(rawUrl);

        const transcriptHash = generateUniqueHash(response.data);
        const totalWords = getTotalWords(response.data.body);
        const content = response.data;
        const originalContent = response.data;


        const existingTranscript = await Transcript.findOne({
          where: { transcriptHash: transcriptHash },
        });

        if (existingTranscript) {
          responseStatus = 409;
          responseMessage = "transcript already exists";
          break;
        }

        if (response.data.transcript_by.includes("TSTBTC")) {
          await Transcript.create({
            transcriptUrl: rawUrl,
            transcriptHash: transcriptHash,
            contentTotalWords: totalWords,
            content: content,
            originalContent: originalContent,
            status: TranscriptStatus.queued,
          });
          break;
        } else {
          responseStatus = 404;
          responseMessage = "Transcript not from TSTBTC - did not queue transcript";
        }
      }

      if (responseStatus !== 200) {
        break;
      }
    }
  } catch (error) {
    responseStatus = 500;
    responseMessage = error instanceof Error ? error.message : "Unable to save URLs in the database";
  }

  return res.status(responseStatus).json({ message: responseMessage });
}
 
