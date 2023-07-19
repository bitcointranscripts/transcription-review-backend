import {
  BelongsTo,
  Column,
  DataType,
  Model,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { SettingsAttribute } from "../../types/settings";
import { User } from "./user";

@Table({
  tableName: "settings",
})
export class Settings extends Model<SettingsAttribute> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  public id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  public instantWithdrawal!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  public userId!: User["id"];

  @BelongsTo(() => User, "userId")
  user!: User["id"];
}
