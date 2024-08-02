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
    // update the user table to add the evaluator permission to permissions enum column
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_permissions" ADD VALUE 'evaluator';
    `);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // remove the evaluator permission from the permissions enum column
    await queryInterface.sequelize.query(`
      DELETE FROM pg_enum
      WHERE enumlabel = 'evaluator'
      AND enumtypid = (
        SELECT oid
        FROM pg_type
        WHERE typname = 'enum_users_permissions'
      );
    `);
  }
};
