'use strict';
const transcripts = require('./transcripts.json');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
      content: JSON.stringify(transcripts[0]),
      originalContent: JSON.stringify(transcripts[0]),
      transcriptHash: 'A8D2eH5moRx9fHJd8/aPmuXQf+BOLMfVUnbJfgr4WT8=',
      status: 'queued',
      claimedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    },
    {
      content: JSON.stringify(transcripts[1]),
      originalContent: JSON.stringify(transcripts[1]),
      transcriptHash: 'xtK2j+u6oJgV2oQG12VOUYCUlh504UyNgx6hDnULhFo=',
      status: 'queued',
      claimedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    },
    {
      content: JSON.stringify(transcripts[2]),
      originalContent: JSON.stringify(transcripts[2]),
      transcriptHash: 'HGgtv7MuB+oN9UWp1/5FKrCqriMadhd0OJj4RpcOALY=',
      status: 'queued',
      claimedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    },
    {
      content: JSON.stringify(transcripts[3]),
      originalContent: JSON.stringify(transcripts[3]),
      transcriptHash: 'lTBXBbgzp7VzuPxP3jQOQR/bpYzK9i2LWXAwRGntZbk=',
      status: 'queued',
      claimedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    },
    {
      content: JSON.stringify(transcripts[4]),
      originalContent: JSON.stringify(transcripts[4]),
      transcriptHash: 'IdXWOYHu/iUDorZOTjH/NaXRYsaIfD8KDe2sToJ53iI=',
      status: 'queued',
      claimedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2023-04-23T00:00:00.000Z",
      updatedAt: "2023-04-23T00:00:00.000Z"
    }
    ], {});

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
