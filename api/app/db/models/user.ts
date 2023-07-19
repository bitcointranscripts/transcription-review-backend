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
import { USER_PERMISSIONS, UserAttributes } from "../../types/user";
import { Settings } from "./settings";

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
  email!: string

  @Column(DataType.STRING)
  jwt?: string

  @Column(DataType.STRING)
  albyToken?: string;

  @Column(DataType.ENUM({ values: Object.values(USER_PERMISSIONS) }))
  public permissions!: USER_PERMISSIONS;

  @Column(DataType.DATE)
  public archivedAt?: Date | null;

  @HasOne(() => Wallet, "userId")
  wallet!: Wallet;

  @HasMany(() => Review, "userId")
  reviews!: Review[];

  @HasMany(() => Transcript, "archivedBy")
  archivedTranscripts!: Transcript[];

  @HasOne(() => Settings, "userId")
  setting!: Settings;
}
