module.exports = (sequelize, Sequelize) => {
  const Review = sequelize.define("review", {
    //FIXME: Include specific times in dates, not specifying time defaults to midnight and we don't want that. We want exact times. Emphasize this in api docs, or use regex to check validity of datetime in backend controllers
    claimedAt: {
      type: Sequelize.DATE,
    },
    submittedAt: {
      type: Sequelize.DATE,
    },
    mergedAt: {
      type: Sequelize.DATE,
    }

  });


  return Review;
};
