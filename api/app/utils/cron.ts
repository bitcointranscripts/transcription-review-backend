import { Review } from "../sequelize/models/review";
import { Transcript } from "../sequelize/models/transcript";
// import { config } from "./config";

const db = require("../sequelize/models");

const config = require("./utils.config");
const { getUnixTimeFromHours } = require("../utils/review.inference");
const CronJob = require("cron").CronJob;

// Requeue transcript if review has expired
function setupExpiryTimeCron(review: Review) {
  const expiryTime =
    // @ts-expect-error
    new Date(review.createdAt).getTime() +
    getUnixTimeFromHours(config.expiryTimeInHours);
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

        Transcript.update(
          { status: "queued", claimedBy: null },
          {
            where: { id: review.transcriptId },
          }
        );
      } catch (err) {
        console.log(err);
      }
    },
    null,
    false,
    null
  );
  job.start();
  return;
}

module.exports = {
  setupExpiryTimeCron,
};
