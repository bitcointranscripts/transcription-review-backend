"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.user, { foreignKey: "userId", as: "user" });
      this.hasMany(models.transaction, { foreignKey: "walletId", as: "transactions" });
    }
  }
  Wallet.init(
    {
      userId: DataTypes.INTEGER,
      balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: "wallet",
    }
  );
  return Wallet;
};
