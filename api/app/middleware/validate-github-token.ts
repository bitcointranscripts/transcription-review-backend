import { NextFunction, Request, Response } from "express";

import { User } from "../db/models";
import { generateJwtToken, verifyGitHubToken } from "../utils/auth";

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
      return res.status(403).json({ error: "Failed to verify GitHub token" });
    }

    let conditions = {};
    if (!githubUser.email) {
      conditions = { githubUsername: githubUser.login };
    } else {
      conditions = { email: githubUser.email };
    }

    const user = await User.findOne({
      where: conditions,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = generateJwtToken(user, githubToken.toString());
    const response = await User.update(
      { jwt: token },
      { where: { id: user.id } }
    );

    if (response[0] !== 1) {
      return res.status(500).json({ error: "Failed to update user token" });
    }

    req.body.userId = user.id;
    req.body.userPermissions = user.permissions;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Failed to verify GitHub token in validate" });
  }
};

export default validateGitHubToken;
