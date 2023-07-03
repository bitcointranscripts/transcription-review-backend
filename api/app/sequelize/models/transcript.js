'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transcript extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.review, { foreignKey: 'transcriptId' });
      this.belongsTo(models.user, { foreignKey: 'archivedBy' });
      this.belongsTo(models.user, { as: 'claimedByUser', foreignKey: 'claimedBy'});
    }
  }
  Transcript.init({
    content: DataTypes.JSON,
    originalContent: DataTypes.JSON,
    transcriptHash: DataTypes.STRING,
    pr_url: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('queued','not queued'),
      defaultValue: 'queued'
    },
    claimedBy: DataTypes.INTEGER,
    archivedBy: DataTypes.INTEGER,
    archivedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'transcript',
  });
  return Transcript;
};