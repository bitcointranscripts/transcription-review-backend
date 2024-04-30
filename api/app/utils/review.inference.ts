import * as diff from "diff";
import { Op } from "sequelize";

import { TranscriptAttributes } from "../types/transcript";
import { wordCount } from "./functions";
import { EXPIRYTIMEINHOURS, HOUR_END_OF_DAY, MILLISECOND_END_OF_DAY, MINUTE_END_OF_DAY, QUERY_REVIEW_STATUS, SECOND_END_OF_DAY } from "./constants";
import { Review } from "../db/models";
import { BuildConditionArgs } from "../types/review";

const unixEpochTimeInMilliseconds = getUnixTimeFromHours(EXPIRYTIMEINHOURS);

const buildIsActiveCondition = (currentTime: number) => {
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

const buildIsInActiveCondition = (currentTime: number) => {
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

const buildIsExpiredAndNotArchivedCondition = (currentTime: number) => {
  const timeStringAt24HoursPrior = new Date(
    currentTime - unixEpochTimeInMilliseconds
  ).toISOString();
  return {
    [Op.and]: {
      mergedAt: { [Op.eq]: null }, // has not been merged
      archivedAt: { [Op.eq]: null }, // has not been archived
      submittedAt: { [Op.eq]: null }, // has not been submitted
      createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
    },
  };
};

const buildMergedCondition = () => {
  const mergedQuery = {
    [Op.and]: [ //ensuring all conditions are met
      { mergedAt: { [Op.not]: null } }, // has been merged
      { archivedAt: { [Op.not]: null } }, // has been archived
    ]
  };
  return mergedQuery;
}

function getUnixTimeFromHours(hours: number) {
  const millisecondsInHour = 60 * 60 * 1000;
  const unixTimeInMilliseconds = hours * millisecondsInHour;
  return unixTimeInMilliseconds;
}

function removeMarkdownElements(text: string) {
  // This regular expression matches Markdown headers, links, images, and inline code.
  const markdownRegex =
    /(\n)|(\\n)|(\#{1,6}\s+.+\n)|(!?\[.+\]\(.+\))|(`[^`]+`)/g;
  const newText = text.replace(markdownRegex, "");

  return newText;
}

function removeArrayBrackets(text: string) {
  const arrayRegex = /\[[^\]]*\]/g;
  const newText = text.replace(arrayRegex, "");

  return newText;
}

const getTotalWords = (text: string) => {
  const textWithoutMarkdown = removeMarkdownElements(text);
  const totalWords = textWithoutMarkdown.split(/\s+/).length;
  return totalWords;
};

async function calculateWordDiff(data: TranscriptAttributes) {
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

  const totalWords = getTotalWords(data.content.body);

  fieldsToConsider.forEach((field) => {
    let originalText = data.originalContent[field] || "";
    let modifiedText = data.content[field] || "";

    // If the field is an array, we need to convert it to a string
    // before we can calculate the diff.
    // TODO! This is a hacky solution. We should fix the transcript json format from tstbtc.
    if (Array.isArray(originalText)) {
      originalText = originalText.join(" ");
    }

    if (Array.isArray(modifiedText)) {
      modifiedText = modifiedText.join(" ");
    }

    // Check if the text contains array brackets
    const hasOriginalArray = /\[.*?\]/.test(originalText);
    const hasModifiedArray = /\[.*?\]/.test(modifiedText);

    if (hasOriginalArray) {
      originalText = removeArrayBrackets(originalText);
    }

    if (hasModifiedArray) {
      modifiedText = removeArrayBrackets(modifiedText);
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


export const buildCondition = ({
  status,
  transcriptId,
  userId,
  mergedAt,
  userSearch,
  submittedAt,
}: BuildConditionArgs) => {
  const condition: { [key: string | number]: any } = {};
  const userCondition: { [Op.or]?: { email?: { [Op.iLike]: string }; githubUsername?: { [Op.iLike]: string } }[] } = {};

  if (status) {
    const currentTime = new Date().getTime();
    switch (status) {
      case QUERY_REVIEW_STATUS.ACTIVE:
        const activeCondition = buildIsActiveCondition(currentTime);
        condition[Op.and as unknown as keyof typeof Op] = activeCondition;
        break;

      case 'expired':
        const expiredCondition = buildIsInActiveCondition(currentTime);
        condition[Op.and as unknown as keyof typeof Op] = expiredCondition;
        break;

      case QUERY_REVIEW_STATUS.PENDING:
        const pendingCondition = buildIsPendingCondition();
        condition[Op.and as unknown as keyof typeof Op] = pendingCondition;
        break;

      case QUERY_REVIEW_STATUS.MERGED:
        const mergedCondition = buildMergedCondition();
        condition[Op.and as unknown as keyof typeof Op] = mergedCondition;
        break;

      default:
        break;
    }
  }

  if (mergedAt) {
    const date = new Date(mergedAt);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      HOUR_END_OF_DAY,
      MINUTE_END_OF_DAY,
      SECOND_END_OF_DAY,
      MILLISECOND_END_OF_DAY
    );

    condition.mergedAt = {
      [Op.gte]: startOfDay,
      [Op.lte]: endOfDay,
    };
  }

  if (submittedAt) {
    const date = new Date(submittedAt);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      HOUR_END_OF_DAY,
      MINUTE_END_OF_DAY,
      SECOND_END_OF_DAY,
      MILLISECOND_END_OF_DAY
    );

    condition.submittedAt = {
      [Op.gte]: startOfDay,
      [Op.lte]: endOfDay,
    };
  }

  if (transcriptId) {
    condition.transcriptId = { [Op.eq]: transcriptId };
  }

  if (userId) {
    condition.userId = { [Op.eq]: userId };
  }

  if (userSearch) {
    const searchCondition = { [Op.iLike]: `%${userSearch.toLowerCase()}%` };
    userCondition[Op.or] = [
      { email: searchCondition },
      { githubUsername: searchCondition },
    ];
  }

  return { condition, userCondition };
};

export const buildReviewResponse = (
  reviews: Review[],
  page: number,
  limit: number,
  totalItems: number
) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
    hasNextPage,
    hasPreviousPage,
    data: reviews,
  };
};

export {
  getUnixTimeFromHours,
  buildIsActiveCondition,
  buildIsPendingCondition,
  buildIsInActiveCondition,
  buildIsExpiredAndNotArchivedCondition,
  calculateWordDiff,
  getTotalWords,
  buildMergedCondition,
};
