import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";
import { Wallet } from "./wallet";
import { Review } from "./review";

class Transaction extends Model {
  public walletId!: number;
  public reviewId!: number;
  public amount!: number;
  public transactionType!: "credit" | "debit";
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
