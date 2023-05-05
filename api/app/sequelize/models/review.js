'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.user);
      this.belongsTo(models.transcript);
    }
  }
  Review.init({
    claimedAt: DataTypes.DATE,
    submittedAt: DataTypes.DATE,
    mergedAt: DataTypes.DATE,
    userId: DataTypes.INTEGER,
    transcriptId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'review',
  });
  return Review;
};