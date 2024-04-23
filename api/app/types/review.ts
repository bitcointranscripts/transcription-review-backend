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


export interface BuildConditionArgs {
  status?: string;
  transcriptId?: number;
  userId?: number;
  mergedAt?: string;
  userSearch?: string;
}
