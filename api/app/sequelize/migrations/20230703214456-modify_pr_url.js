'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // remove pr_url column for transcript and claimedAt column for reviews

    await queryInterface.removeColumn(
      'transcripts',
      'pr_url',
    );

    await queryInterface.removeColumn(
      'reviews',
      'claimedAt',
    );

    //remove requeue from status enum

    await queryInterface.changeColumn(
      'transcripts',
      'status',
      {
        type: Sequelize.ENUM('queued', 'not queued'),
        defaultValue: 'queued'
      }
    );

    //add email_address column to users table

    await queryInterface.addColumn(
      'users',
      'email_address',
      {
        type: Sequelize.STRING,
        unique: true,
      }
    );

    //add jwt column to users table

    await queryInterface.addColumn(
      'users',
      'jwt',
      {
        type: Sequelize.STRING,
        unique: true,
      }
    );
  },


  async down(queryInterface, Sequelize) {

    // add pr_url column for transcript and claimedAt column for reviews

    await queryInterface.addColumn(
      'transcripts',
      'pr_url',
      {
        type: Sequelize.STRING,
        unique: true,
      }
    );

    await queryInterface.addColumn(
      'reviews',
      'claimedAt',
      {
        type: Sequelize.DATE
      }
    );

    // add requeue to status enum

    await queryInterface.changeColumn(
      'transcripts',
      'status',
      {
        type: Sequelize.ENUM('queued', 'not queued', 'requeued'),
        defaultValue: 'queued'
      }
    );
  }
};
