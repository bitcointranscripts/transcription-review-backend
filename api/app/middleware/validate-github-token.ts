import { NextFunction, Request, Response } from "express";

import { verifyGitHubToken } from "../utils/auth";
import { Logger } from "../helpers/logger";

const validateGitHubToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const githubToken = req.headers["x-github-token"];
  const email = req.body.email;

  if (!githubToken) {
    Logger.error("No github token provided in validate");
    return res
      .status(401)
      .json({ error: "Unauthorized. No github token provided!" });
  }

  if (!email) {
    Logger.error("No email provided in validate");
    return res.status(400).json({ error: "Bad Input. No email provided!" });
  }

  try {
    const githubUser = await verifyGitHubToken(githubToken);
    if (githubUser instanceof Error || !githubUser.login) {
      throw new Error("Failed to verify GitHub token");
    }

    req.body.username = githubUser?.login;
    req.body.email = email;
    req.body.githubToken = githubToken;
    next();
  } catch (error) {
    Logger.error(`Error validating GitHub token: ${error}`);
    return res
      .status(401)
      .json({ error: "Failed to verify GitHub token in validate" });
  }
};

export default validateGitHubToken;
