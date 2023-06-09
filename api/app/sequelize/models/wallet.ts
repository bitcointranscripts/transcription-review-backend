"use strict";

import { Sequelize, Model, DataTypes, ModelStatic } from "sequelize";
import { User } from "./user";
import { Transaction } from "./transaction";

class Wallet extends Model {
  public userId!: number;
  public id!: string;
  public balance!: number;
  public updatedAt!: Date;

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
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      balance: { type: DataTypes.INTEGER, defaultValue: 0 },
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "wallet",
    }
  );
}

export { Wallet };
