export enum USER_PERMISSIONS {
  REVIEWER = "reviewer",
  ADMIN = "admin",
}

export interface UserAttributes {
  id?: number;
  githubUsername: string;
  authToken?: string;
  permissions: "reviewer" | "admin";
  archivedAt?: Date | null;
}
