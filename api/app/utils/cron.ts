import cron from "cron";

import { Review } from "../db/models/review";
import { Transcript } from "../db/models/transcript";
import { TRANSCRIPT_STATUS } from "../types/transcript";
import { getUnixTimeFromHours } from "../utils/review.inference";
import { EXPIRYTIMEINHOURS } from "./constants";
import { deleteCache } from "../db/helpers/redis";
import { redis } from "../db";

const CronJob = cron.CronJob;

// Requeue transcript if review has expired
async function setupExpiryTimeCron(review: Review) {
  const expiryTime =
    new Date(review.createdAt).getTime() +
    getUnixTimeFromHours(EXPIRYTIMEINHOURS);
  const expiryDate = new Date(expiryTime);

  const job = new CronJob(
    expiryDate,
    async () => {
      try {
        const thisReview = await Review.findByPk(review.id);

        // don't requeue transcripts whose review has been merged or submitted
        if (thisReview?.mergedAt || thisReview?.submittedAt) return;

        // TODO: archivedAt field for expired reviews
        // const now = new Date()
        // Review.update({ archivedAt: now }, {
        //   where: { id: review.id }
        // })

        await Transcript.update(
          { status: TRANSCRIPT_STATUS.QUEUED, claimedBy: null },
          {
            where: { id: review.transcriptId },
          }
        );
        const totalItems = await Transcript.count();
        const limit = 5;
        const totalPages = Math.ceil(totalItems / limit);
        for (let page = 1; page <= totalPages; page++) {
          await deleteCache(`transcripts:page:${page}`);
        }
        await deleteCache(`transcript:${review.transcriptId}`);
        await redis.srem("cachedTranscripts", review.transcriptId);
      } catch (err) {
        console.log(err);
      }
    },
    null,
    false,
    undefined
  );
  job.start();
  return;
}

export { setupExpiryTimeCron };
