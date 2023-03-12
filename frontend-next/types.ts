export type Transcript = {
  id: number;
  archivedAt: Nullable<Date>;
  archivedBy: Nullable<string>;
  createdAt: Nullable<Date>;
  content: TranscriptContent;
  status?: string;
  updatedAt: Nullable<Date>;
  originalContent: TranscriptContent;
  // userId:     Nullable<number>;
  // reviewedAt: Nullable<Date>;
  // claimedBy:  Nullable<number>;
};

type TranscriptContent = {
  body: string;
  categories: string[];
  date: Date;
  media: Nullable<string>;
  speakers: string[];
  tags: string[];
  title: string;
  transcript_by: Nullable<string>;
};

type Nullable<T> = T | null;
