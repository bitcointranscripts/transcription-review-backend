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
  transcriptUrl: string | null;
  status: string;
  claimedBy?: number | null;
  archivedBy?: number | null;
  archivedAt?: Date | null;
  contentTotalWords: number;
}

export interface BaseParsedMdContent extends TranscriptAttributes {
  body: string;
  [key: string]: string | string[] | any;
}

