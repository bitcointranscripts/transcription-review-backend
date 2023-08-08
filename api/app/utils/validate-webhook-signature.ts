import * as crypto from "crypto";
import { Request } from "express";

const GITHUB_WEBHOOK_TOKEN = process.env.GITHUB_WEBHOOK_TOKEN;

if (!GITHUB_WEBHOOK_TOKEN) {
  throw new Error("GITHUB_WEBHOOK_TOKEN environment variable is not defined");
}
export const verify_signature = (req: Request) => {
  if (!req.body) {
    return false;
  }
  if (!req.headers) {
    return false;
  }
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "staging"
  ) {
    return true;
  }
  const signature = crypto
    .createHmac("sha256", GITHUB_WEBHOOK_TOKEN)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return `sha256=${signature}` === req.headers["x-hub-signature-256"];
};
