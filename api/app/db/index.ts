import { config } from "dotenv";
import { Sequelize } from "sequelize-typescript";

import {
  Review,
  Transaction,
  Transcript,
  User,
  Wallet,
  Settings,
} from "./models";

config();
const DB_URL =
  process.env.DB_URL || "postgres://postgres:postgres@localhost:5432/postgress";
export const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "production",
  models: [Review, User, Transcript, Transaction, Wallet, Settings],
});
