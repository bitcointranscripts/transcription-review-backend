import { Review } from "../db/models";

// This type combines the ReviewAttributes and Review model
// because the Review model which extends the Model class
// does not have the status field in the database schema.
// It is only present in the API level and is not stored in the database.
export type IReview = Review & ReviewAttributes;

export interface ReviewAttributes {
  id?: number;
  submittedAt?: Date | null;
  archivedAt?: Date | null;
  mergedAt?: Date | null;
  userId: number;
  transcriptId: number;
  pr_url?: string | null;
  branchUrl?: string | null;
  status?: string;
}

export interface BuildConditionArgs {
  status?: string;
  transcriptId?: number;
  userId?: number;
  mergedAt?: string;
  userSearch?: string;
  submittedAt?: string;
}
