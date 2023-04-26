'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      claimedAt: {
        type: Sequelize.DATE
      },
      submittedAt: {
        type: Sequelize.DATE
      },
      mergedAt: {
        type: Sequelize.DATE
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { 
          model: 'users',
          key: 'id'
        }
      },
      transcriptId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'transcripts',
          key: 'id'
        }
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
    await queryInterface.dropTable('reviews');
  }
};