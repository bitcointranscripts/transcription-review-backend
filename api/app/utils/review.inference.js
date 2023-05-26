const config = require("./config");
const db = require("../sequelize/models");
const diff = require("diff");
const wordCount = require("word-count");
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
    submittedAt: { [Op.eq]: null }, // no submittedAt
  };
};
const buildIsPendingCondition = () => {
  return {
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

    // If the field is an array, we need to convert it to a string
    // before we can calculate the diff.
    // TODO! This is a hacky solution. We should fix the transcript json format from tstbtc.
    if (Array.isArray(modifiedText)) {
      modifiedText = modifiedText.join(" ");
    }
    if (
      (originalText.trim().startsWith("[") &&
        originalText.trim().endsWith("]")) ||
      (modifiedText.trim().startsWith("[") && modifiedText.trim().endsWith("]"))
    ) {
      let getOriginalText = originalText.trim().slice(1, -1);
      let getModifiedText = modifiedText.trim().slice(1, -1);
      originalText = getOriginalText
        .split(",")
        .map((text) => text.trim().slice(1, -1))
        .join(" ");
      modifiedText = getModifiedText
        .split(",")
        .map((text) => text.trim().slice(1, -1))
        .join(" ");
    }

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

module.exports = {
  getUnixTimeFromHours,
  buildIsActiveCondition,
  buildIsPendingCondition,
  buildIsInActiveCondition,
  calculateWordDiff,
};
