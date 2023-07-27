import axios from "axios";
import jwt from "jsonwebtoken";

import { UserAttributes } from "../types/user";
import { JWTEXPIRYTIMEINHOURS } from "./constants";

export async function verifyGitHubToken(token: string | string[] | undefined) {
  const response = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status !== 200 || response.statusText !== "OK") {
    throw new Error("Failed to verify GitHub token");
  }

  return response.data;
}

export function generateJwtToken(
  user: UserAttributes,
  githubAuthToken: string
) {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  const token = jwt.sign(
    { userId: user.id, permissions: user.permissions, githubAuthToken },
    secretKey,
    { expiresIn: JWTEXPIRYTIMEINHOURS }
  );
  return token;
}
