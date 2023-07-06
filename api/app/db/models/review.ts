import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from "sequelize-typescript";

import { ReviewAttributes } from "../../types/review";
import { Transaction } from "./transaction";
import { Transcript } from "./transcript";
import { User } from "./user";

@Table({
  tableName: "reviews",
})
export class Review extends Model<ReviewAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  public id!: number;

  @Column(DataType.DATE)
  public submittedAt?: Date;

  @Column({type: DataType.DATE, allowNull: true})
  public archivedAt?: Date | null;

  @Column(DataType.DATE)
  public mergedAt?: Date;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  public userId!: User["id"];

  @ForeignKey(() => Transcript)
  @Column(DataType.INTEGER)
  public transcriptId!: Transcript["id"];

  @BelongsTo(() => User)
  public user!: User;

  @BelongsTo(() => Transcript)
  public transcript!: Transcript;

  @HasOne(() => Transaction)
  public transaction!: Transaction;
}
