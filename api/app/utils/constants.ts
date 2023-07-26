const PR_EVENT_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  MERGED: "merged",
} as const;

const QUERY_REVIEW_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
} as const;

const SATS_REWARD_RATE_PER_WORD = 0.5;

const expiresInHours = 24;

const currentTime = Math.floor(Date.now() / 1000);

const JWTEXPIRYTIMEINHOURS = currentTime + (expiresInHours * 60 * 60);


const EXPIRYTIMEINHOURS = 24;
const MAXPENDINGREVIEWS = 3;
const INVOICEEXPIRYTIME = 5 * 60 * 1000
const FEE_LIMIT_SAT=100
const INVOICE_TIME_OUT = 60
const PICO_BTC_TO_SATS = 10000;

export {
  PR_EVENT_ACTIONS,
  QUERY_REVIEW_STATUS,
  SATS_REWARD_RATE_PER_WORD,
  EXPIRYTIMEINHOURS,
  MAXPENDINGREVIEWS,
  JWTEXPIRYTIMEINHOURS,
  INVOICEEXPIRYTIME,
  FEE_LIMIT_SAT,
  INVOICE_TIME_OUT,
  PICO_BTC_TO_SATS
};


