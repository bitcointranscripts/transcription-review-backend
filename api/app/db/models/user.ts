import {
  Column,
  DataType,
  HasMany,
  HasOne,
  Model,
  Table,
} from "sequelize-typescript";

import { Review } from "./review";
import { Transcript } from "./transcript";
import { Wallet } from "./wallet";
import { USERPERMISSIONS, UserAttributes } from "../../types/user";

@Table({
  tableName: "users",
})
export class User extends Model<UserAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  public id!: number;

  @Column(DataType.STRING)
  public githubUsername!: string;

  @Column(DataType.STRING)
  authToken?: string;
  // Todo! make this not nullable

  @Column(DataType.ENUM({ values: Object.values(USERPERMISSIONS) }))
  public permissions!: USERPERMISSIONS;

  @Column(DataType.DATE)
  public archivedAt!: Date | null;

  @HasOne(() => Wallet, "userId")
  wallet!: Wallet;

  @HasMany(() => Review, "userId")
  reviews!: Review[];

  @HasMany(() => Transcript, "archivedBy")
  archivedTranscripts!: Transcript[];
}
