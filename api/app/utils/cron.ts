import Queue from "bull";

import { Review } from "../db/models/review";
import { Transcript } from "../db/models/transcript";
import { TranscriptStatus } from "../types/transcript";
import { buildIsExpiredAndNotArchivedCondition, getUnixTimeFromHours } from "../utils/review.inference";
import { EXPIRYTIMEINHOURS } from "./constants";
import { deleteCache, resetRedisCachedPages } from "../db/helpers/redis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, redis } from "../db";

const expiryQueue = new Queue<{reviewId: number}>("cron-for-review-expiry", {
  redis: {
    port: REDIS_PORT,
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
  },
  defaultJobOptions: { delay: getUnixTimeFromHours(EXPIRYTIMEINHOURS) }
})

// Requeue transcript if review has expired
export const addToExpiryQueue = async (reviewId: number) => {
  await expiryQueue.add({reviewId})
}

expiryQueue.process(async (job, done) => {
  const { reviewId } = job.data
  try {
    const thisReview = await Review.findByPk(reviewId);

    if (!thisReview) return;

    // don't requeue transcripts whose review has been merged or submitted
    if (thisReview?.mergedAt || thisReview?.submittedAt) return;

    const now = new Date()
    thisReview.update({ archivedAt: now })

    await Transcript.update(
      { status: TranscriptStatus.queued, claimedBy: null },
      {
        where: { id: thisReview.transcriptId },
      }
    );
    console.log("updated transcript and review")
    await resetRedisCachedPages();
    await deleteCache(`transcript:${thisReview.transcriptId}`);
    await redis.srem("cachedTranscripts", thisReview.transcriptId);

  } catch (err) {
    console.log(err);
  }
  done()
})


// run CRON once daily to archive expired review that could have slipped by

const dailyCheckForMissedExpiredReviews = new Queue("daily-cron-expired", {
  redis: {
    port: REDIS_PORT,
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
  },
  defaultJobOptions: { repeat: { cron: "0 0 * * *" } },
})

export const startDailyExpiredReviewsCheck = async () => await dailyCheckForMissedExpiredReviews.add({})

dailyCheckForMissedExpiredReviews.process(async (job, done) => {
  try {
    const now = new Date()
    const currentTime = now.getTime()
    const condition = buildIsExpiredAndNotArchivedCondition(currentTime)
    const expiredAndUnarchived = await Review.findAll({where: condition })
    
    if (expiredAndUnarchived.length) {
      const promiseArray = expiredAndUnarchived.map(review => {
        return review.update({ archivedAt: now }).then((res) => {
          return Transcript.update(
            { status: TranscriptStatus.queued, claimedBy: null },
            {
              where: { id: res.transcriptId },
            }
          ).then(async (res) => {
            if (res[0] === 1) {
              await deleteCache(`transcript:${review.transcriptId}`);
              await redis.srem("cachedTranscripts", review.transcriptId);
            }
          })
        }).catch((err) => {
          throw err
        })
      })
      await Promise.allSettled(promiseArray)
      await resetRedisCachedPages();
    }
  } catch (err) {
    console.error(err)
  }
  done()
});

startDailyExpiredReviewsCheck()
