import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";
import { Review } from "./review";
import { User } from "./user";

class Transcript extends Model {
  public id!: number;
  public content!: any;
  public originalContent!: any;
  public transcriptHash!: string;
  public pr_url!: string;
  public status!: "queued" | "not queued" | "requeued";
  public claimedBy?: number;
  public archivedBy?: number;
  public archivedAt?: Date;

  // Other model attributes and methods go here

  static associate(models: {
    Review: ModelStatic<Review>;
    User: ModelStatic<User>;
  }) {
    Transcript.hasMany(models.Review, { foreignKey: "transcriptId" });
    Transcript.belongsTo(models.User, { foreignKey: "archivedBy" });
    Transcript.belongsTo(models.User, {
      as: "claimedByUser",
      foreignKey: "claimedBy",
    });
  }
}

export default function initModel(
  sequelize: Sequelize
): ModelStatic<Transcript> {
  return Transcript.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      content: DataTypes.JSON,
      originalContent: DataTypes.JSON,
      transcriptHash: DataTypes.STRING,
      pr_url: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM("queued", "not queued", "requeued"),
        defaultValue: "queued",
      },
      claimedBy: DataTypes.INTEGER,
      archivedBy: DataTypes.INTEGER,
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "transcript",
    }
  );
}

export { Transcript };
