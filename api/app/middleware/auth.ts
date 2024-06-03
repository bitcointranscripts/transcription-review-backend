import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { USER_PERMISSIONS } from "../types/user";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const prefix = "Bearer ";

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  const jwtSecret = process.env.JWT_SECRET;

  if (authHeader && authHeader.startsWith(prefix)) {
    const [_, token] = authHeader.split(" ");
    try {
      jwt.verify(token, jwtSecret, async (err, payload) => {
        if (err) {
          return res.status(401).json({ error: "Invalid token" });
        }

        if (typeof payload === "string" || !payload) {
          return res.status(401).json({ error: "Invalid token payload" });
        }

        if (!payload.userId || !payload.githubAuthToken) {
          return res.status(401).json({ error: "User not found" });
        }

        req.body.userId = payload.userId;
        req.body.userPermissions = payload.permissions;
        next();
      });
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } else {
    return res.status(401).json({ error: "Token not found" });
  }
};

export const authorizeRoles = (allowedRoles: USER_PERMISSIONS[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.userId || !allowedRoles.includes(req.body.userPermissions)) {
      return res.status(403).json({ error: `${allowedRoles.join(' or ')} role required` });
    }
    next();
  };
};
