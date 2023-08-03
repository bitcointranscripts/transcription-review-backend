import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { verifyGitHubToken } from "../utils/auth";
import { redis } from "../db";
import { deleteCache } from "../db/helpers/redis";

const validateGitHubToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const githubToken = req.headers["x-github-token"];
  const email = req.body.email;
  console.log({email})

  if (!githubToken) {
    return res
      .status(401)
      .json({ error: "Unauthorized. No github token provided!" });
  }

  if (!email) {
    return res.status(404).json({ error: "Unauthorized. No email provided!" });
  }

  try {
    const redisCacheKey = `user:${email}`;
    const cachedUserJwt = await redis.get(redisCacheKey);

    if (cachedUserJwt) {
      const token = JSON.parse(cachedUserJwt);
      let hasTokenExpired = false;

      jwt.verify(token, process.env.JWT_SECRET!, (err: any, payload: any) => {
        if (err) {
          throw new Error();
        }
        if (!payload || typeof payload === "string") {
          throw new Error();
        }
        const exp = payload.exp;
        if (exp && Math.floor(Date.now() / 1000) > exp) {
          hasTokenExpired = true;
        }
      });
      if (!hasTokenExpired) {
        res.status(200).json({ jwt: token });
        return;
      }
      await deleteCache(redisCacheKey);
    }

    const githubUser = await verifyGitHubToken(githubToken);
    if (!githubUser.login) {
      throw new Error();
    }
    console.log(githubToken);
    req.body.username = githubUser?.login;
    req.body.email = email;
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ error: "Failed to verify GitHub token in validate" });
  }
};

export default validateGitHubToken;
