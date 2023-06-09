// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const process = require('process');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const dbConfig = require(__dirname + '../../../config/config.js')[env];
// const db = {};

// const sequelize = new Sequelize(`${dbConfig.url}`, dbConfig);


// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });

// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// // console.log(db)

// module.exports = db;
// Compare this snippet from api/app/sequelize/models/index.ts:

// "use strict";

// import fs from "fs";
// import path from "path";
// import { Sequelize, DataTypes } from "sequelize";

// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || "development";
// const dbConfig = require(__dirname + "../../../config/config.js")[env];
// const db: any = {};

// const sequelize = new Sequelize(`${dbConfig.url}`, dbConfig);

// fs.readdirSync(__dirname)
//   .filter(
//     (file: string) =>
//       file.indexOf(".") !== 0 &&
//       file !== basename &&
//       file.slice(-3) === ".ts" &&
//       file.indexOf(".test.ts") === -1
//   )
//   .forEach((file: string) => {
//     const model = require(path.join(__dirname, file)).initModel(
//       sequelize,
//       DataTypes
//     );
//     db[model.name] = model;
//   }
// );

// Object.keys(db).forEach((modelName: string) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// }
// );

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// // console.log(db)

// export default db;


import { Sequelize, Model, ModelStatic } from 'sequelize';
import path from 'path';
import fs from 'fs';
const env = process.env.NODE_ENV || "development";
const dbConfig = require(__dirname + "../../../config/config.js")[env];
const db: any = {};

const basename = path.basename(__filename);

interface Db {
  [key: string]: ModelStatic<Model>;
}

const sequelize = new Sequelize(dbConfig.url, dbConfig);

let associateModelFunctions: Function[] = [];

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.ts' && file.indexOf('.test.ts') === -1)
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    const sequelizeModel = model.default(sequelize);
    db[sequelizeModel.name] = sequelizeModel;
    if (sequelizeModel.associate) {
      associateModelFunctions.push(sequelizeModel.associate);
    }
  });

// Once all models are imported, invoke the associate functions
associateModelFunctions.forEach(associateFunc => associateFunc(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { db, sequelize, Sequelize };

