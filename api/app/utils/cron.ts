import Queue from "bull";
import path from "path";
import { Worker } from "worker_threads";

import { redis, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../db";
import { deleteCache, resetRedisCachedPages } from "../db/helpers/redis";
import { Review, Transcript } from "../db/models";
import { Logger } from "../helpers/logger";
import { sendAlert } from "../helpers/sendAlert";
import { TranscriptStatus } from "../types/transcript";
import {
  buildIsExpiredAndNotArchivedCondition,
  getUnixTimeFromHours,
} from "../utils/review.inference";
import { EXPIRYTIMEINHOURS } from "./constants";

const redisConfig = {
  port: REDIS_PORT,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
};

const expiryQueue = new Queue<{ reviewId: number }>("cron-for-review-expiry", {
  redis: redisConfig,
  defaultJobOptions: { delay: getUnixTimeFromHours(EXPIRYTIMEINHOURS) },
});

const creditTransactionQueue = new Queue<{
  transcript: Transcript;
  review: Review;
}>("credit-transaction", {
  redis: redisConfig,
});

export function startBackgroundTaskForCreditTransaction(
  transcript: Transcript,
  review: Review,
  done: any
) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "./wordDiffWorker.js"), {
      workerData: {
        transcript: transcript,
        review: review,
      },
    });

    worker.on("message", (result) => {
      resolve(result);
      done();
      Logger.info(`Worker transaction processed:, ${JSON.stringify(result)}`);
    });
    worker.on("error", (error) => {
      reject(error);
      done();
      Logger.error(`Worker error:, ${JSON.stringify(error)}`);
      sendAlert({
        message: `Error in background task for credit transaction: ${error.message}`,
        isError: true,
        transcriptTitle: transcript.originalContent?.title,
        transcriptUrl: transcript.transcriptUrl ?? review.pr_url,
        type: "transaction",
      });
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
        done();
        Logger.error(`Worker stopped with exit code ${code}`);
        sendAlert({
          message: `Worker stopped with exit code ${code}`,
          isError: true,
          transcriptTitle: transcript.originalContent?.title,
          transcriptUrl: transcript.transcriptUrl ?? review.pr_url,
          type: "transaction",
        });
      }
    });
  });
}

export const addCreditTransactionQueue = async (
  transcript: Transcript,
  review: Review
) => {
  await creditTransactionQueue.add({ transcript, review });
};

creditTransactionQueue.process(async (job, done) => {
  const { transcript, review } = job.data;
  try {
    startBackgroundTaskForCreditTransaction(transcript, review, done);
    Logger.info(`Credit transaction created for review: ${review.id}`);
  } catch (error) {
    Logger.error("Error in credit transaction queue", error);
  }
  done();
});

// Requeue transcript if review has expired
export const addToExpiryQueue = async (reviewId: number) => {
  await expiryQueue.add({ reviewId });
};

expiryQueue.process(async (job, done) => {
  const { reviewId } = job.data;
  try {
    const thisReview = await Review.findByPk(reviewId);

    if (!thisReview) return;

    // don't archive review or requeue transcripts whose review has been merged, submitted or already archived
    if (
      thisReview?.mergedAt ||
      thisReview?.submittedAt ||
      thisReview?.archivedAt
    )
      return;

    const now = new Date();
    thisReview.update({ archivedAt: now });

    await Transcript.update(
      { status: TranscriptStatus.queued, claimedBy: null },
      {
        where: { id: thisReview.transcriptId },
      }
    );

    await resetRedisCachedPages();
    await deleteCache(`transcript:${thisReview.transcriptId}`);
    await redis.srem("cachedTranscripts", thisReview.transcriptId);
  } catch (err) {
    Logger.error("error in expiry queue", err);
  }
  done();
});

// run CRON once daily to archive expired review that could have slipped by

const dailyCheckForMissedExpiredReviews = new Queue("daily-cron-expired", {
  redis: redisConfig,
  defaultJobOptions: {
    repeat: { cron: "0 0 * * *", key: "dailyExpiredCheck" },
  },
});

export const startDailyExpiredReviewsCheck = async () =>
  await dailyCheckForMissedExpiredReviews.add({});

dailyCheckForMissedExpiredReviews.process(async (job, done) => {
  try {
    const now = new Date();
    const currentTime = now.getTime();
    const condition = buildIsExpiredAndNotArchivedCondition(currentTime);
    const expiredAndUnarchived = await Review.findAll({ where: condition });

    if (expiredAndUnarchived.length) {
      Logger.info(
        `Found ${expiredAndUnarchived.length} expired reviews to archive`
      );
      const promiseArray = expiredAndUnarchived.map(async (review) => {
        try {
          const res = await review.update({ archivedAt: now });
          const res_1 = await Transcript.update(
            { status: TranscriptStatus.queued, claimedBy: null },
            {
              where: { id: res.transcriptId },
            }
          );
          if (res_1[0] === 1) {
            await deleteCache(`transcript:${review.transcriptId}`);
            await redis.srem("cachedTranscripts", review.transcriptId);
          }
          Logger.info(`Archived review: ${JSON.stringify(review)}`);
        } catch (err) {
          throw err;
        }
      });
      await Promise.allSettled(promiseArray);
      await resetRedisCachedPages();
    }
  } catch (err) {
    Logger.error("error in daily check for expired reviews", err);
  }
  done();
});

startDailyExpiredReviewsCheck();
