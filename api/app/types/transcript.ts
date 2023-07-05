export enum TRANSCRIPT_STATUS {
  QUEUED = "QUEUED",
  NOT_QUEUED = "NOT_QUEUED",
}

export const TranscriptStatus = {
  queued: "queued",
  not_queued: "not queued",
} as const;

export interface TranscriptAttributes {
  id?: number;
  content: any;
  originalContent: any;
  transcriptHash: string;
  pr_url?: string;
  status: string;
  claimedBy?: number;
  archivedBy?: number;
  archivedAt?: Date;
}
