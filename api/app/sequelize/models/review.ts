import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";
import { User } from "./user";
import { Transcript } from "./transcript";
import { Transaction } from "./transaction";

class Review extends Model {
  public id!: number;
  public claimedAt?: Date;
  public submittedAt?: Date;
  public archivedAt?: Date;
  public mergedAt?: Date;
  public userId!: number;
  public transcriptId!: number;
  public pr_url!: string;

  // Other model attributes and methods go here

  static associate(models: {
    User: ModelStatic<User>;
    Transcript: ModelStatic<Transcript>;
    Transaction: ModelStatic<Transaction>;
  }) {
    Review.belongsTo(models.User);
    Review.belongsTo(models.Transcript);
    Review.hasOne(models.Transaction);
  }
}

export default function initModel(sequelize: Sequelize): ModelStatic<Review> {
  return Review.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      claimedAt: DataTypes.DATE,
      submittedAt: DataTypes.DATE,
      archivedAt: DataTypes.DATE,
      mergedAt: DataTypes.DATE,
      userId: DataTypes.INTEGER,
      transcriptId: DataTypes.INTEGER,
      pr_url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "review",
    }
  );
}

export { Review };
