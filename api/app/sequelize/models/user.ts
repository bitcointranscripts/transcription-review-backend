'use strict';

import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";
import { Wallet } from "./wallet";
import { Review } from "./review";
import { Transcript } from "./transcript";

class User extends Model {
  public id!: number;
  public githubUsername!: string;
  public authToken!: string;
  public permissions!: 'reviewer' | 'admin';
  public archivedAt!: Date | null;

  // Other model attributes and methods go here

  static associate(models: {
    Wallet: ModelStatic<Wallet>;
    Review: ModelStatic<Review>;
    Transcript: ModelStatic<Transcript>;
  }) {
    this.hasOne(models.Wallet, { foreignKey: 'userId' });
    this.hasMany(models.Review, { foreignKey: 'userId' });
    this.hasMany(models.Transcript, { foreignKey: 'archivedBy' });
  }
}

export default function initModel(sequelize: Sequelize): ModelStatic<User> {
  return User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      githubUsername: DataTypes.STRING,
      authToken: DataTypes.STRING,
      permissions: DataTypes.ENUM('reviewer', 'admin'),
      archivedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'user',
    }
  );
}

export { User };
// module.exports = (sequelize: Sequelize, DataTypes: any) => {
//   class User extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models: { wallet: ModelStatic<Model<any, any>>; review: ModelStatic<Model<any, any>>; transcript: ModelStatic<Model<any, any>>; }) {
//       // define association here
//       this.hasOne(models.wallet, { foreignKey: 'userId' });
//       this.hasMany(models.review, { foreignKey: 'userId' });
//       this.hasMany(models.transcript, { foreignKey: 'archivedBy' });
//     }
//   }
//   User.init({
//     githubUsername: DataTypes.STRING,
//     authToken: DataTypes.STRING,
//     permissions: DataTypes.ENUM('reviewer', 'admin'),
//     archivedAt: DataTypes.DATE
//   }, {
//     sequelize,
//     modelName: 'user',
//   });
//   return User;
// };