const db = require("../sequelize/models");
const Transcript = db.transcript
const Review = db.review;
const config = require("./config");
const { getUnixTimeFromHours } = require("../utils/review.inference")
const CronJob = require('cron').CronJob;

// Requeue transcript if review has expired
function setupExpiryTimeCron (review) {

  const expiryTime = new Date(review.createdAt).getTime() + getUnixTimeFromHours(config.expiryTimeInHours);
  const expiryDate = new Date(expiryTime)

  const job = new CronJob(
    expiryDate,
    async () => {
      try {
        const thisReview = await Review.findByPk(review.id)
        
        // don't requeue transcripts whose review has been merged
        if (thisReview.mergedAt) return;
        
        // TODO: archivedAt field for expired reviews
        // const now = new Date()
        // Review.update({ archivedAt: now }, {
        //   where: { id: review.id }
        // })

        Transcript.update({ status: 'queued', claimedBy: null }, {
          where: { id: review.transcriptId }
        })
      } catch(err) {
        console.log(err)
      }
    },
    null, false, null,
  );
  job.start()
  return;
}

module.exports = {
  setupExpiryTimeCron
}
