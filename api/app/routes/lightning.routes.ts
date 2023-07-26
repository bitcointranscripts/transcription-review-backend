import type { Express } from "express";
import express from "express";

import * as alby from "../controllers/alby.controller";
import * as lightning from "../controllers/lightning.controller";
import { auth } from "../middleware/auth";

export function lightningRoutes(app: Express) {
  const router = express.Router();

  router.post("/alby/token", auth, alby.saveAlbyToken);

  router.post("/invoice/alby", auth, alby.payAlbyInvoice);

  router.post("/invoice/pay", auth, lightning.payInvoiceController);

  app.use("/api/lightning", router);
}
