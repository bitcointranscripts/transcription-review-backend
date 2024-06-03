export enum USER_PERMISSIONS {
  REVIEWER = "reviewer",
  ADMIN = "admin",
  EVALUATOR = "evaluator",
}

export interface UserAttributes {
  id?: number;
  githubUsername: string;
  email: string;
  jwt?: string | null;
  albyToken?: string;
  permissions: USER_PERMISSIONS;
  archivedAt?: Date | null;
}
