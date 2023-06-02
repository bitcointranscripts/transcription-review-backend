const PR_EVENT_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  MERGED: "merged",
};

const TRANCRIPT_STATUS = {
  QUEUED: "queued",
  NOT_QUEUED: "not queued",
};

const QUERY_REVIEW_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
};

const TRANSACTION_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
};

const TRANSACTION_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
};

const SATS_REWARD_RATE_PER_WORD = 0.5;

export {
  PR_EVENT_ACTIONS,
  TRANCRIPT_STATUS,
  QUERY_REVIEW_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  SATS_REWARD_RATE_PER_WORD,
};
