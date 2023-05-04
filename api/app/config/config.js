const dotenv = require("dotenv")
dotenv.config();

module.exports = {
  development: {
    url: process.env.DB_URL,
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
   url: process.env.DB_URL,
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
}
