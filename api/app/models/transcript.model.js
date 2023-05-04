module.exports = (sequelize, Sequelize) => {
  const Transcript = sequelize.define("transcript", {
    content: {
      type: Sequelize.JSON
    },
    originalContent: {
      type: Sequelize.JSON,
      allowNull: false
    },
    transcriptHash: { // prevent a transcript from being uploaded more than once
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    pr_url: { 
      type: Sequelize.STRING,
      unique: true,
    },
    status: {
      type: Sequelize.ENUM('queued','not queued','requeued','completed'),
      allowNull: false,
      defaultValue: 'queued'
    },
    archivedAt: {
      type: Sequelize.DATE
    }
  });


  return Transcript;
};
