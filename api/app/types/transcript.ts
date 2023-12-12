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
  transcriptUrl: string;
  status: string;
  claimedBy?: number | null;
  archivedBy?: number | null;
  archivedAt?: Date | null;
  contentTotalWords: number;
}


export interface TSTBTCAttributes {
  title: string;
  transcript_by: string;
  categories: string[];
  tags: string[];
  speakers: string[];
  date: null | string;
  loc: string;
  media: string;
  body: string;
}

