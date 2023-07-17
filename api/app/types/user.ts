export enum USER_PERMISSIONS {
  REVIEWER = "reviewer",
  ADMIN = "admin",
}

export interface UserAttributes {
  id?: number;
  githubUsername: string;
  email: string;
  jwt?: string | null;
  authToken?: string;
  permissions: "reviewer" | "admin";
  archivedAt?: Date | null;
}
