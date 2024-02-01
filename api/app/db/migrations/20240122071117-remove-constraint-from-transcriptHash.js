'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('transcripts', 'transcripts_transcriptHash_key');
    await queryInterface.changeColumn('transcripts', 'transcriptHash', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.addConstraint('transcripts', {
      fields: ['transcriptHash'],
      type: 'unique',
      name: 'transcripts_transcriptHash_key'
    });
    await queryInterface.changeColumn('transcripts', 'transcriptHash', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
