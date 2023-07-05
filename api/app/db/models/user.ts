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

interface UserAttributes {
  id?: number;
  githubUsername: string;
  authToken?: string;
  permissions: "reviewer" | "admin";
  archivedAt: Date | null;
}

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

  @Column(DataType.ENUM("reviewer", "admin"))
  public permissions!: "reviewer" | "admin";

  @Column(DataType.DATE)
  public archivedAt!: Date | null;

  @HasOne(() => Wallet, "userId")
  wallet!: Wallet;

  @HasMany(() => Review, "userId")
  reviews!: Review[];

  @HasMany(() => Transcript, "archivedBy")
  archivedTranscripts!: Transcript[];
}
