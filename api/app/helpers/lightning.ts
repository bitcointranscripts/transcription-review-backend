import axios from "axios";
import https from "https";

import { CreateInvoiceResponse } from "../types/lightning";
import { FEE_LIMIT_SAT, INVOICE_TIME_OUT } from "../utils/constants";

const MACAROON = process.env.MACAROON;
const LND_URL = process.env.LND_URL;
if (!MACAROON) {
  throw new Error("Macaroon environment variable not set");
}
if (!LND_URL) {
  throw new Error("LND url environment variable not set");
}

const myNode = axios.create({
  baseURL: LND_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: { "Grpc-Metadata-macaroon": MACAROON },
});

const payInvoice = async (invoice: string) => {
  try {
    let res = await myNode.post("/v2/router/send", {
      payment_request: invoice,
      timeout_seconds: INVOICE_TIME_OUT,
      fee_limit_sat: FEE_LIMIT_SAT,
    });
    if (res.status === 200) {
      return { success: true, data: res.data };
    }
  } catch (err) {
    console.error(err);
    return { error: err, data: null };
  }
};

const createInvoice = async (amountSatoshis: number) => {
  try {
    let res = await myNode.post("/v1/invoices", {
      value: amountSatoshis,
    });
    return res.data as CreateInvoiceResponse;
  } catch (err) {
    console.error(err);
  }
};

const isSettled = async (r_hash: string) => {
  try {
    const buffer = Buffer.from(r_hash, "base64");
    let res = await myNode.get(`/v1/invoice/${buffer.toString("hex")}`);
    return res.data.settled;
  } catch (err) {
    console.log(err);
  }
};

export { payInvoice, createInvoice, isSettled };
