const User = require("./user.model.js")
module.exports = (sequelize, Sequelize) => {
  const Transcript = sequelize.define("transcript", {
    title: {
      type: Sequelize.STRING
    },
    details: {
      type: Sequelize.STRING
    },
    reviewedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
//    claimed_by : {
//        type: Sequelize.INTEGER,
//        allowNull: true,
//        references: {
//            model: User,
//            key: 'id'
//        }
//    },
    claimedAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  return Transcript;
};
