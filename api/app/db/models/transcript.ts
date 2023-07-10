import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";

import { User } from "./user";
import { TranscriptStatus, TranscriptAttributes } from "../../types/transcript";

@Table({ tableName: "transcripts" })
export class Transcript extends Model<TranscriptAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id!: number;

  @Column(DataType.JSON)
  content!: any;

  @Column(DataType.JSON)
  originalContent!: any;

  @Column(DataType.STRING)
  transcriptHash!: string;

  @Column({
    type: DataType.DATE,
  })
  archivedAt?: Date | null;

  @Column(DataType.INTEGER)
  archivedBy?: User["id"] | null;

  @Column({
    type: DataType.ENUM({ values: Object.values(TranscriptStatus) }),
    defaultValue: TranscriptStatus.not_queued,
  })
  status!: string;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  claimedBy?: User["id"] | null;

  @BelongsTo(() => User, {
    as: "claimedByUser",
    foreignKey: "claimedBy",
  })
  user!: User;
}
