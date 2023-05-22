'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      walletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallets', key: 'id' }
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      transactionType: {
        type: Sequelize.ENUM('credit', 'debit', 'pending'),
        allowNull: false
      },
      timestamp: {
        allowNull: false,
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
    await queryInterface.dropTable('transactions');
  }
};