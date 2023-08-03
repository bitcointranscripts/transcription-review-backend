import { config } from "dotenv";
import { Sequelize } from "sequelize-typescript";
import { Redis } from "ioredis";

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
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "production",
  models: [Review, User, Transcript, Transaction, Wallet, Settings],
  pool: {
    max: 100,
  },
  dialectOptions: {
    ssl: {
      require: process.env.NODE_ENV === "production",
      rejectUnauthorized: false,
    },
    keepAlive: true,
  },
});

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});
