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
   await queryInterface.bulkInsert('users', [{
    githubUsername: 'test9',
    authToken: 'test9',
    permissions: 'reviewer',
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
