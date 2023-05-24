"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.wallet, { foreignKey: "walletId" });
      this.belongsTo(models.review, { foreignKey: "reviewId" });
    }
  }
  Transaction.init(
    {
      walletId: DataTypes.STRING,
      reviewId: DataTypes.INTEGER,
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      transactionType: {
        type: DataTypes.ENUM("credit", "debit"),
        allowNull: false,
      },
      transactionStatus: {
        type: DataTypes.ENUM("success", "failed", "pending"),
        allowNull: false,
      },
      timestamp: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "transaction",
    }
  );
  return Transaction;
};
