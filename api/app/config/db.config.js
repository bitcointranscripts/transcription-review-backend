module.exports = {
  HOST: "db",
  PORT: "5433",
  USER: "postgres",
  PASSWORD: "123",
  DB: "testdb1",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
