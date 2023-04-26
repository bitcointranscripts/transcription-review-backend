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
      this.hasMany(models.review, { foreignKey: 'userId' });
      this.hasMany(models.transcript, { foreignKey: 'archivedBy' });
    }
  }
  Transcript.init({
    content: DataTypes.JSON,
    originalContent: DataTypes.JSON,
    status: DataTypes.ENUM('queued','not queued','requeued'),
    archivedBy: DataTypes.INTEGER,
    archivedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'transcript',
  });
  return Transcript;
};