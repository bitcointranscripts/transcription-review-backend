"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("transcripts", "pr_url");
    await queryInterface.removeColumn("reviews", "claimedAt");
    await queryInterface.changeColumn("transcripts", "status", {
      type: Sequelize.ENUM("queued", "not queued"),
      defaultValue: "queued",
    });
    await queryInterface.addColumn("users", "email", {
      type: Sequelize.STRING,
      unique: true,
    });
    await queryInterface.addColumn("users", "jwt", {
      type: Sequelize.STRING,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("transcripts", "pr_url", {
      type: Sequelize.STRING,
      unique: true,
    });
    await queryInterface.addColumn("reviews", "claimedAt", {
      type: Sequelize.DATE,
    });
    await queryInterface.changeColumn("transcripts", "status", {
      type: Sequelize.ENUM("queued", "not queued", "requeued"),
      defaultValue: "queued",
    });
    await queryInterface.removeColumn("users", "email", {
      type: Sequelize.STRING,
      unique: true,
    });
    await queryInterface.removeColumn("users", "jwt", {
      type: Sequelize.STRING,
      unique: true,
    });
  },
};
