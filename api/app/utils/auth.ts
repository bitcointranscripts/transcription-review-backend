import jwt from "jsonwebtoken";
import { JWTEXPIRYTIMEINHOURS } from "./constants";
import { UserAttributes } from "../types/user";


// Verify the OAuth token with GitHub API
export async function verifyGitHubToken(token: string | string[] | undefined) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to verify GitHub token");
  }

  return response.json();
}

  // Generate JWT with user information
  export function generateJwtToken(user: UserAttributes, githubAuthToken: string) {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }
    const token = jwt.sign(
      { userId: user.id, permissions: user.permissions, githubAuthToken},
      secretKey,
      { expiresIn: JWTEXPIRYTIMEINHOURS}
    );
    return token;
  }