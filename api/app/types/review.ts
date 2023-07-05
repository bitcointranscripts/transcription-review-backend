export interface ReviewAttributes {
  id?: number;
  claimedAt?: Date;
  submittedAt?: Date;
  archivedAt?: Date;
  mergedAt?: Date;
  userId: number;
  transcriptId: number;
  pr_url?: string;
}
