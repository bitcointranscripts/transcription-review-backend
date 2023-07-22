import type { Express } from "express";
import express from "express";
import * as alby from "../controllers/alby.controller";
import * as opennode from "../controllers/opennode.controller";
import { auth } from "../middleware/auth";

export function lightningRoutes(app: Express) {
  const router = express.Router();

  // Save a New Alby Refresh Token
  router.post("/alby/token",auth, alby.saveAlbyToken);

  // Generate Invoice
  router.post("/alby/invoice",auth, alby.generateInvoice);

  // Generate a LN-URL withdraw QR code
  router.post("/lnurl-withdraw",auth, opennode.lnurlWithdrawal);

  // Pay a Lightning invoice
  router.post("/invoice",auth, opennode.lninvoiceWithdrawal);

  app.use("/api/lightning", router);
}
