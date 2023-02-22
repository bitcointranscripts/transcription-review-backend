module.exports = (sequelize, Sequelize) => {
  const Transcript = sequelize.define("transcript", {
    title: {
      type: Sequelize.STRING
    },
    details: {
      type: Sequelize.TEXT
    },
    reviewedAt: {
      type: Sequelize.DATE,
    },
    claimedAt: {
      type: Sequelize.DATE,
    }
  });


  return Transcript;
};
