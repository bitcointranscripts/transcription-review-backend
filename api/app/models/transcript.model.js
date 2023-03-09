module.exports = (sequelize, Sequelize) => {
  const Transcript = sequelize.define("transcript", {
    content: {
      type: Sequelize.JSON
    },
    originalContent: {
      type: Sequelize.JSON
      //FIXME: Don't allow null values for this field
    },
    status: {
      type: Sequelize.ENUM('queued','not queued','requeued'),
      allowNull: false,
      defaultValue: 'not queued'
    },
    archivedAt: {
      type: Sequelize.DATE
    }
  });


  return Transcript;
};
