'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
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
  User.init({
    githubUsername: DataTypes.STRING,
    authToken: DataTypes.STRING,
    permissions: DataTypes.ENUM('reviewer', 'admin'),
    archivedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'user',
  });
  return User;
};