import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../db/models";
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
          return res.status(403).json({ error: "Invalid token" });
        }

        if (typeof payload === "string" || !payload) {
          return res.status(403).json({ error: "Invalid token payload" });
        }

        const user = await User.findByPk(payload.userId);
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
    return res.status(403).json({ error: "Token not found" });
  }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.userId || req.body.userPermissions !== USER_PERMISSIONS.ADMIN) {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
};
