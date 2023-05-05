'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      githubUsername: {
        unique: true,
      allowNull: false,
        type: Sequelize.STRING
      },
      authToken: {
        unique: true,
        type: Sequelize.STRING
      },
      permissions: {
        allowNull: false,
        defaultValue: 'reviewer',
        type: Sequelize.ENUM('reviewer', 'admin')
      },
      archivedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};