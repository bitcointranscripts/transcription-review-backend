module.exports = (sequelize, Sequelize) => {
  const Transcript = sequelize.define("transcript", {
    title: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.JSON
    },
    originalContent: {
      type: Sequelize.JSON
    },
    status: {
      type: Sequelize.ENUM('Q','NQ','RQ'),
      allowNull: false,
      defaultValue: 'NQ'
    },
    archivedAt: {
      type: Sequelize.DATE
    }
  });


  return Transcript;
};
