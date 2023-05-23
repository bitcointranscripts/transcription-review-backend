// 'use strict';
// // const {
// //   Model
// // } = require('sequelize');
// import { Sequelize, Model, ModelStatic } from "sequelize";
// module.exports = (sequelize: Sequelize, DataTypes: any) => {
//   class Transcript extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models: { review: ModelStatic<Model<any, any>>; user: ModelStatic<Model<any, any>>; }) {
//       // define association here
//       this.hasMany(models.review, { foreignKey: 'transcriptId' });
//       this.belongsTo(models.user, { foreignKey: 'archivedBy' });
//       this.belongsTo(models.user, { as: 'claimedByUser', foreignKey: 'claimedBy'});
//     }
//   }
//   Transcript.init({
//     content: DataTypes.JSON,
//     originalContent: DataTypes.JSON,
//     transcriptHash: DataTypes.STRING,
//     pr_url: DataTypes.STRING,
//     status: {
//       type: DataTypes.ENUM('queued','not queued','requeued'),
//       defaultValue: 'queued'
//     },
//     claimedBy: DataTypes.INTEGER,
//     archivedBy: DataTypes.INTEGER,
//     archivedAt: DataTypes.DATE
//   }, {
//     sequelize,
//     modelName: 'transcript',
//   });
//   return Transcript;
// };

import { Sequelize, Model, ModelStatic, DataTypes } from 'sequelize';
import { Review } from './review';
import { User } from './user';

class Transcript extends Model {
  public id!: number;
  public content!: any;
  public originalContent!: any;
  public transcriptHash!: string;
  public pr_url!: string;
  public status!: 'queued' | 'not queued' | 'requeued';
  public claimedBy?: number;
  public archivedBy?: number;
  public archivedAt?: Date;

  // Other model attributes and methods go here

  static associate(models: { Review: ModelStatic<Review>; User: ModelStatic<User> }) {
    Transcript.hasMany(models.Review, { foreignKey: 'transcriptId' });
    Transcript.belongsTo(models.User, { foreignKey: 'archivedBy' });
    Transcript.belongsTo(models.User, { as: 'claimedByUser', foreignKey: 'claimedBy' });
  }
}

export default function initModel(sequelize: Sequelize): ModelStatic<Transcript> {
  return Transcript.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      content: DataTypes.JSON,
      originalContent: DataTypes.JSON,
      transcriptHash: DataTypes.STRING,
      pr_url: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('queued', 'not queued', 'requeued'),
        defaultValue: 'queued',
      },
      claimedBy: DataTypes.INTEGER,
      archivedBy: DataTypes.INTEGER,
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'transcript',
    }
  );
}

export { Transcript };
