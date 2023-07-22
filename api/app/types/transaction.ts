export enum TRANSACTION_STATUS {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
}

export enum TRANSACTION_TYPE {
  CREDIT = "credit",
  DEBIT = "debit",
}

export interface TransactionAttributes {
  id: string;
  walletId: string;
  reviewId: number | null;
  amount: number;
  transactionType: TRANSACTION_TYPE;
  transactionStatus: TRANSACTION_STATUS;
  timestamp: Date;
}
