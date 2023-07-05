"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transcripts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      content: {
        type: Sequelize.JSON,
      },
      originalContent: {
        type: Sequelize.JSON,
      },
      transcriptHash: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      pr_url: {
        type: Sequelize.STRING,
        unique: true,
      },
      status: {
        allowNull: false,
        defaultValue: "queued",
        type: Sequelize.ENUM("queued", "not queued", "requeued"),
      },
      claimedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      archivedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      archivedAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transcripts");
  },
};
