import dotenv from "dotenv";
import express, { Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import {
  reviewRoutes,
  transcriptRoutes,
  userRoutes,
  webhookRoutes,
} from "./app/routes";
import { sequelize } from "./app/sequelize/models";
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
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

//check if sequelize connect properly
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err: any) => {
    console.error("Unable to connect to the database:", err);
  });

// define routes
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to Bitcoin Transcripts." });
});
userRoutes(app);
reviewRoutes(app);
transcriptRoutes(app);
webhookRoutes(app);

//force can be used in a development environment but not in production as it will drop the table first and create again, alter will match the existing model and change the table accordingly. Alter is also not advisable in production as will delete data of the columns removed or type changed, but if you want to avoid migrations and update your table this is the option.

// db.sequelize.sync()
//  .then(() => {
//    console.log("All models were synchronised successfully.");
//  })
//  .catch((err) => {
//    console.log("Failed to sync db: " + err.message);
//  });

// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// set port, listen for requests
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
