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
  webhookRoutes
} from "./app/routes";
import { sequelize } from "./app/db";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

async function synchronizeModels() {
  try {
    await sequelize.sync();
    console.log("Database initialized successfully.");
  } catch (error) {
    switch (error) {
      case UniqueConstraintError:
        console.log("A unique constraint error occurred:", error);
        break;
      case ForeignKeyConstraintError:
        console.log("A foreign key constraint error occurred:", error);
        break;
      case DatabaseError:
        console.log("A general database error occurred:", error);
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

const PORT = process.env.PORT;
app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  })
  .on("error", (err) => {
    console.log("Error starting server:", err);
  });
