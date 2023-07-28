import { NextFunction, Request, Response } from "express";

import { verifyGitHubToken } from "../utils/auth";

const validateGitHubToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const githubToken = req.headers["x-github-token"];

  if (!githubToken) {
    return res
      .status(401)
      .json({ error: "Unauthorized. No github token provided!" });
  }

  try {
    const githubUser = await verifyGitHubToken(githubToken);
    if (!githubUser.login) {
      throw new Error();
    }

    req.body.username = githubUser?.login;
    req.body.email = githubUser?.email;
    next();
  } catch (error) {
    console.log(error)
    return res
      .status(403)
      .json({ error: "Failed to verify GitHub token in validate" });
  }
};

export default validateGitHubToken;
