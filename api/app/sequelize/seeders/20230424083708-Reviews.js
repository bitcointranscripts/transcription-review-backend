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

   await queryInterface.bulkInsert('reviews', [{
    claimedAt: "2023-04-23T00:00:00.000Z",
    submittedAt: "2023-04-23T00:00:00.000Z",
    mergedAt: "2023-04-23T00:00:00.000Z",
    userId: 1,
    transcriptId: 1,
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
