import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} from "sequelize";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import {
  logout,
  reviewRoutes,
  transactionRoutes,
  transcriptRoutes,
  userRoutes,
  webhookRoutes,
  lightningRoutes,
} from "./app/routes";
import { redis, sequelize } from "./app/db";
import { Logger } from "./app/helpers/logger";

dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bitcoin Transcripts API documentation",
      version: "1.0.0",
      description:
        "This is documentation for the Transcription Queue project API",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
  },
  apis: ["./app/routes/*.ts"],
};
const specs = swaggerJsdoc(options);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

async function synchronizeModels() {
  redis.on("connect", () => {
    Logger.info("Redis connected successfully.");
  });

  redis.on("error", (err: any) => {
    Logger.error("Redis connection error:", err);
  });
  try {
    await sequelize.sync();
    Logger.info("All models were synchronized successfully.");
  } catch (error) {
    switch (error) {
      case UniqueConstraintError:
        Logger.error("A unique constraint error occurred:", error);
        break;
      case ForeignKeyConstraintError:
        Logger.error("A foreign key constraint error occurred:", error);
        break;
      case DatabaseError:
        Logger.error("A database error occurred:", error);
        break;
      default:
        break;
    }
  }
}

synchronizeModels();

// define routes
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to Bitcoin Transcripts." });
});
userRoutes(app);
reviewRoutes(app);
transactionRoutes(app);
transcriptRoutes(app);
logout(app);
webhookRoutes(app);
lightningRoutes(app);

const PORT = process.env.PORT;
app
  .listen(PORT, () => {
    Logger.info(`Server is running on port ${PORT}.`);
  })
  .on("error", (err) => {
    Logger.error(err);
  });
