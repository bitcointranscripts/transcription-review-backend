'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('transcripts', 'transcriptUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('reviews', 'branchUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('transcripts', 'transcriptUrl');
    await queryInterface.removeColumn('reviews', 'branchUrl');
  }
};