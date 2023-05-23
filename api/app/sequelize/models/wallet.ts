"use strict";

import { Sequelize, Model, DataTypes, ModelStatic } from "sequelize";
import { User } from "./user";
import { Transaction } from "./transaction";

interface WalletAttributes {
  userId: number;
  balance: number;
}

class Wallet extends Model<WalletAttributes> {
  public userId!: number;
  public balance!: number;

  // Other model attributes and methods go here

  static associate(models: {
    User: ModelStatic<User>;
    Transaction: ModelStatic<Transaction>;
  }) {
    Wallet.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Wallet.hasMany(models.Transaction, {
      foreignKey: "walletId",
      as: "transactions",
    });
  }
}

export default function initModel(sequelize: Sequelize): ModelStatic<Wallet> {
  return Wallet.init(
    {
      userId: DataTypes.INTEGER,
      balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: "wallet",
    }
  );
}

export { Wallet };
