const config = require("./config");
const db = require("../sequelize/models");
const diff = require("diff");
const wordCount = require("word-count");
const { SATS_REWARD_RATE_PER_WORD } = require("./constants");
const Op = db.Sequelize.Op;

const unixEpochTimeInMilliseconds = getUnixTimeFromHours(
  config.expiryTimeInHours
);

const buildIsActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(
    currentTime - unixEpochTimeInMilliseconds
  ).toISOString();
  return {
    createdAt: { [Op.gte]: timeStringAt24HoursPrior },
    mergedAt: { [Op.eq]: null }, // no mergedAt
    archivedAt: { [Op.eq]: null }, // no archivedAt
  };
};
const buildIsPendingCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(
    currentTime - unixEpochTimeInMilliseconds
  ).toISOString();
  return {
    createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
    submittedAt: { [Op.not]: null }, // has been submitted
    mergedAt: { [Op.eq]: null }, // no mergedAt
    archivedAt: { [Op.eq]: null }, // no archivedAt
  };
};

const buildIsInActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(
    currentTime - unixEpochTimeInMilliseconds
  ).toISOString();
  return {
    [Op.or]: {
      mergedAt: { [Op.not]: null }, // has been merged
      archivedAt: { [Op.not]: null }, // has been archived
      // inactive conditions when review has expired
      [Op.and]: {
        createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
        submittedAt: { [Op.eq]: null }, // has not been submitted
      },
    },
  };
};

function getUnixTimeFromHours(hours) {
  const millisecondsInHour = 60 * 60 * 1000;
  const unixTimeInMilliseconds = hours * millisecondsInHour;
  return unixTimeInMilliseconds;
}

async function calculateWordDiff(data) {
  const fieldsToConsider = [
    "title",
    "transcript_by",
    "categories",
    "tags",
    "speakers",
    "body",
  ];
  let totalDiff = 0;
  let addedWords = 0;
  let removedWords = 0;
  const totalWords = data.originalContent.body.split(/\s+/).length;

  fieldsToConsider.forEach((field) => {
    let originalText = data.originalContent[field] || "";
    let modifiedText = data.content[field] || "";

    let difference = diff.diffWords(originalText, modifiedText);

    addedWords += difference
      .filter((part) => part.added)
      .reduce((count, part) => count + wordCount(part.value), 0);

    removedWords += difference
      .filter((part) => part.removed)
      .reduce((count, part) => count + wordCount(part.value), 0);

    totalDiff += Math.abs(addedWords + removedWords);
  });

  return { totalDiff, totalWords, addedWords, removedWords };
}

async function calculateCreditAmount(associatedTranscript) {
  const { totalDiff, totalWords } = await calculateWordDiff(
    associatedTranscript
  );
  const rewardForWords = totalWords * SATS_REWARD_RATE_PER_WORD;
  const rewardForDiff = totalDiff * SATS_REWARD_RATE_PER_WORD;
  const creditAmount = rewardForWords + rewardForDiff;
  return creditAmount;
}

module.exports = {
  getUnixTimeFromHours,
  buildIsActiveCondition,
  buildIsPendingCondition,
  buildIsInActiveCondition,
  calculateWordDiff,
  calculateCreditAmount,
};
