export enum TRANSACTION_STATUS {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
}

export enum TRANSACTION_TYPE {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export interface TransactionAttributes {
  id: string;
  walletId: string;
  reviewId: number;
  amount: number;
  transactionType: TRANSACTION_TYPE;
  transactionStatus: TRANSACTION_STATUS;
  timestamp: Date;
}
