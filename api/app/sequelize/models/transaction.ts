// "use strict";
// // const { Model } = require("sequelize");
// import { Sequelize, Model, ModelStatic } from "sequelize";
// module.exports = (sequelize: Sequelize, DataTypes: any) => {
//   class Transaction extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models: { wallet: ModelStatic<Model<any, any>>; }) {
//       // define association here
//       this.belongsTo(models.wallet, { foreignKey: "walletId" });
//     }
//   }
//   Transaction.init(
//     {
//       walletId: DataTypes.INTEGER,
//       amount: {
//         type: DataTypes.DECIMAL,
//         allowNull: false,
//       },
//       transactionType: {
//         type: DataTypes.ENUM("credit", "debit", "pending"),
//         allowNull: false,
//       },
//       timestamp: DataTypes.DATE,
//     },
//     {
//       sequelize,
//       modelName: "transaction",
//     }
//   );
//   return Transaction;
// };

import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";
import { Wallet } from "./wallet";
import { Review } from "./review";

class Transaction extends Model {
  public id!: string;
  public walletId!: string;
  public reviewId!: number;
  public amount!: number;
  public transactionType!: "credit" | "debit" | "pending";
  public transactionStatus!: "success" | "failed" | "pending";
  public timestamp!: Date;

  // Other model attributes and methods go here

  static associate(models: {
    Wallet: ModelStatic<Wallet>;
    Review: ModelStatic<Review>;
  }) {
    Transaction.belongsTo(models.Wallet, { foreignKey: "walletId" });
    Transaction.belongsTo(models.Review, { foreignKey: "reviewId" });
  }
}

export default function initModel(
  sequelize: Sequelize
): ModelStatic<Transaction> {
  return Transaction.init(
    {
      id: DataTypes.STRING,
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
}

export { Transaction };
