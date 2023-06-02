const PR_EVENT_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  MERGED: "merged",
} as const;

const TRANCRIPT_STATUS = {
  QUEUED: "queued",
  NOT_QUEUED: "not queued",
} as const;

const QUERY_REVIEW_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
} as const;

const TRANSACTION_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const;

const TRANSACTION_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
} as const;

const SATS_REWARD_RATE_PER_WORD = 0.5;

export {
  PR_EVENT_ACTIONS,
  TRANCRIPT_STATUS,
  QUERY_REVIEW_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  SATS_REWARD_RATE_PER_WORD,
};
