'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert('transcripts', [{
      originalContent: null,
      content: null,
      status: 'queued',
      archivedBy: 6,
      archivedAt: "2023-04-23T00:00:00.000Z",
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    }], {});

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
