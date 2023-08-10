"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex("transcripts", ["archivedAt"]);
    await queryInterface.addIndex("transcripts", ["archivedBy"]);
    await queryInterface.addIndex("transcripts", ["status"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("transcripts", ["archivedAt"]);
    await queryInterface.removeIndex("transcripts", ["archivedBy"]);
    await queryInterface.removeIndex("transcripts", ["status"]);
  },
};
