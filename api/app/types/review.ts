export interface ReviewAttributes {
  id?: number;
  submittedAt?: Date | null;
  archivedAt?: Date | null;
  mergedAt?: Date | null;
  userId: number;
  transcriptId: number;
  pr_url?: string | null;
  branchUrl?: string | null;
}
