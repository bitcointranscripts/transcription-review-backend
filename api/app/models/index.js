const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model.js")(sequelize, Sequelize);
db.transcripts = require("./transcript.model.js")(sequelize, Sequelize);
db.reviews = require("./review.model.js")(sequelize, Sequelize);


//FIXME: User id and Transcription id in Review model cannot be empty
db.users.hasMany(db.reviews, {
  foreignKey: { key: 'id', name: 'userId'}
});
db.reviews.belongsTo(db.users);

db.transcripts.hasMany(db.reviews, {
  foreignKey: { key: 'id', name: 'transcriptId'}
});
db.reviews.belongsTo(db.transcripts);

module.exports = db;
