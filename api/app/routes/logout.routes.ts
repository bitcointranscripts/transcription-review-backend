import type { Express } from "express";
import express from "express";

import * as users from "../controllers/user.controller";

export function logout(app: Express) {
  const router = express.Router();
  router.post("/", users.logout);
  app.use("/api/logout", router);
}
