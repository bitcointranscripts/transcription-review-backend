import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";

import { Wallet } from "./wallet";
import { Review } from "./review";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  TransactionAttributes,
} from "../../types/transaction";

@Table({
  tableName: "transactions",
})
export class Transaction extends Model<TransactionAttributes> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Wallet)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  walletId!: Wallet["id"];

  @ForeignKey(() => Review)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  reviewId!: Review["id"];

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.ENUM({
      values: Object.values(TRANSACTION_TYPE),
    }),
    allowNull: false,
  })
  transactionType!: TRANSACTION_TYPE;

  @Column({
    type: DataType.ENUM({
      values: Object.values(TRANSACTION_STATUS),
    }),
    allowNull: false,
  })
  transactionStatus!: TRANSACTION_STATUS;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  timestamp!: Date;

  @BelongsTo(() => Wallet)
  wallet!: Wallet;

  @BelongsTo(() => Review)
  review!: Review;
}
