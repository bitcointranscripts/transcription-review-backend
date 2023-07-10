import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import { Transaction } from "./transaction";
import { User } from "./user";
import { WalletAttributes } from "../../types/wallet";

@Table({
  tableName: "wallets",
})
export class Wallet extends Model<WalletAttributes> {
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true,
  })
  public id!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  public balance!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  public userId!: User["id"];

  @BelongsTo(() => User)
  public user!: User;

  @HasMany(() => Transaction)
  public transactions!: Transaction[];

  @BeforeCreate
  static addUUID(instance: Wallet) {
    instance.id = uuidv4();
  }
}
