const PR_EVENT_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  MERGED: "merged",
} as const;

const QUERY_REVIEW_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
  MERGED: "merged",
} as const;

const SATS_REWARD_RATE_PER_WORD = 0.5;

const expiresInHours = 24;

const currentTime = Math.floor(Date.now() / 1000);

const JWTEXPIRYTIMEINHOURS = currentTime + expiresInHours * 60 * 60;

// This is a random number that is used to note the number of pages to be cached
const PAGE_COUNT = 100;

const EXPIRYTIMEINHOURS = 24;
const MAX_PENDING_REVIEWS = 6;
const MERGED_REVIEWS_THRESHOLD = 3;
const INVOICEEXPIRYTIME = 5 * 60 * 1000;
const FEE_LIMIT_SAT = 100;
const INVOICE_TIME_OUT = 60;
const PICO_BTC_TO_SATS = 10000;

const DB_QUERY_LIMIT = 10;
const DB_TXN_QUERY_LIMIT = 20;
const DB_START_PAGE = 1;

const PUBLIC_PROFILE_REVIEW_LIMIT = 5;

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const HOUR_END_OF_DAY = 23;
const MINUTE_END_OF_DAY = 59;
const SECOND_END_OF_DAY = 59;
const MILLISECOND_END_OF_DAY = 999;

const DELAY_IN_BETWEEN_REQUESTS = 3000; // Delay of 3 second between requests

export {
  PR_EVENT_ACTIONS,
  QUERY_REVIEW_STATUS,
  SATS_REWARD_RATE_PER_WORD,
  EXPIRYTIMEINHOURS,
  MAX_PENDING_REVIEWS,
  JWTEXPIRYTIMEINHOURS,
  INVOICEEXPIRYTIME,
  FEE_LIMIT_SAT,
  INVOICE_TIME_OUT,
  PICO_BTC_TO_SATS,
  DB_QUERY_LIMIT,
  DB_TXN_QUERY_LIMIT,
  DB_START_PAGE,
  PUBLIC_PROFILE_REVIEW_LIMIT,
  LOG_LEVEL,
  HOUR_END_OF_DAY,
  MINUTE_END_OF_DAY,
  SECOND_END_OF_DAY,
  MILLISECOND_END_OF_DAY,
  PAGE_COUNT,
  DELAY_IN_BETWEEN_REQUESTS,
  MERGED_REVIEWS_THRESHOLD,
};
