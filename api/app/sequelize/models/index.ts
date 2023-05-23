import { Sequelize, Model, ModelStatic } from "sequelize";
import path from "path";
import fs from "fs";
const env = process.env.NODE_ENV || "development";
const dbConfig = require(__dirname + "../../../config/config.js")[env];
const db: any = {};

const basename = path.basename(__filename);

interface Db {
  [key: string]: ModelStatic<Model>;
}

const sequelize = new Sequelize(dbConfig.url, dbConfig);

let associateModelFunctions: Function[] = [];

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".ts" &&
      file.indexOf(".test.ts") === -1
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    console.log(model);
    model.default(sequelize);
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Once all models are imported, invoke the associate functions
associateModelFunctions.forEach(associateFunc => associateFunc(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { db, sequelize, Sequelize };
