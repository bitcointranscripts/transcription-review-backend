import type { Express } from "express";
import express from "express";
import * as alby from "../controllers/alby.controller";
import * as opennode from "../controllers/opennode.controller";

export function lightningRoutes(app: Express) {
  const router = express.Router();

  // Save a New Alby Refresh Token
  router.post("/alby/token", alby.saveAlbyToken);

  // Generate Invoice
  router.post("/alby/invoice", alby.generateInvoice);

  // Generate a LN-URL withdraw QR code
  router.post("/opennode/lnurl-withdraw", opennode.lnurlWithdrawal);

  // Pay a Lightning invoice
  router.post("/opennode/invoice", opennode.lninvoiceWithdrawal);

  app.use("/api/lightning", router);
}
