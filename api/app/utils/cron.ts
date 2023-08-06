import Queue from "bull";

import { Review } from "../db/models/review";
import { Transcript } from "../db/models/transcript";
import { TranscriptStatus } from "../types/transcript";
import { getUnixTimeFromHours } from "../utils/review.inference";
import { EXPIRYTIMEINHOURS } from "./constants";
import { deleteCache } from "../db/helpers/redis";
import { redis } from "../db";

const expiryQueue = new Queue<{reviewId: number}>("cron-for-review-expiry", {
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
    const totalItems = await Transcript.count();
    const limit = 5;
    const totalPages = Math.ceil(totalItems / limit);
    for (let page = 1; page <= totalPages; page++) {
      await deleteCache(`transcripts:page:${page}`);
    }
    await deleteCache(`transcript:${thisReview.transcriptId}`);
    await redis.srem("cachedTranscripts", thisReview.transcriptId);

  } catch (err) {
    console.log(err);
  }
  done()
})
