const express = require("express"),
  bodyParser = require("body-parser"),
  swaggerJsdoc = require("swagger-jsdoc"),
  swaggerUi = require("swagger-ui-express");

const cors = require("cors");

const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");

//force can be used in a development environment but not in production as it will drop the table first and create again, alter will match the existing model and change the table accordingly. Alter is also not advisable in production as will delete data of the columns removed or type changed, but if you want to avoid migrations and update your table this is the option.

//db.sequelize.sync()
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

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Bitcoin Transcripts." });
});

require("./app/routes/user.routes")(app);
require("./app/routes/review.routes")(app);
require("./app/routes/transcript.routes")(app);

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
  apis: ["./app/routes/*.js"],
};

const specs = swaggerJsdoc(options);
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs,{explorer: true})
);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
