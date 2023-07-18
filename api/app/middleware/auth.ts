import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../db/models";
import { USER_PERMISSIONS } from "../types/user";
import { verifyGitHubToken, generateJwtToken } from "../utils/auth";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const githubToken = req.headers["x-github-token"];
  const userId = req.body.userId;
  const prefix = "Bearer ";

  if (!githubToken) {
    return res.status(401).json({ error: "Unauthorized. No token provided!" });
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. No user ID provided!" });
  }

  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  const jwtSecret = process.env.JWT_SECRET_KEY;

  if (authHeader && authHeader.startsWith(prefix)) {
    const [_, token] = authHeader.split(" ");
    try {
      jwt.verify(token, jwtSecret, async (err, payload) => {
        if (err) {
          return res.status(403).json({ error: "Invalid token" });
        }

        if (typeof payload === "string" || !payload) {
          return res.status(403).json({ error: "Invalid token payload" });
        }

        const user = await User.findByPk(userId);
        if (!user || user.jwt !== token) {
          return res.status(403).json({ error: "User not found" });
        }
        
        req.body.userId = user.id;
        req.body.userPermissions = user.permissions;
        next();
      });
    } catch (error) {
      return res.status(403).json({ error: "Invalid token" });
    }
  } else {
    try {
      const githubUser = await verifyGitHubToken(githubToken);

      if(!githubUser) {
        return res.status(403).json({ error: "Failed to verify GitHub token" });
      }

      // Check if the user already exists in the database
      const user = await User.findOne({
        where: { id: userId},
      });


      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate JWT with user information
      const token = generateJwtToken(user, githubToken.toString());

      // Update the user record with the JWT
      await User.update({ jwt: token }, { where: { id: user.id } });

      req.body.userId = user.id;
      req.body.userPermissions = user.permissions;
      next();
    } catch (error) {
      return res.status(403).json({ error: "Failed to verify GitHub token" });
    }
  }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.userId || req.body.userPermissions !== USER_PERMISSIONS.ADMIN) {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
};
