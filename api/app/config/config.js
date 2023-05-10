const dotenv = require("dotenv")
dotenv.config();

module.exports = {
  development: {
    url: process.env.DB_URL,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: { maxConnections: 5, maxIdleTime: 30 },
  },
  production: {
    url: process.env.DB_URL,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: { maxConnections: 5, maxIdleTime: 30 },
    language: 'en'
  }
}
