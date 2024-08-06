import axios, { AxiosError } from "axios";
import https from "https";

import { CreateInvoiceResponse, PayInvoiceResponse } from "../types/lightning";
import { FEE_LIMIT_SAT, INVOICE_TIME_OUT } from "../utils/constants";
import { Logger } from "./logger";

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
      const data = res.data;
      const responseJsonStrings = data
        .split("\n")
        .filter((str: string) => str.trim() !== "");
      const jsonObjects = responseJsonStrings.map((str: string) =>
        JSON.parse(str)
      );
      const jsonArray = jsonObjects.map(
        (obj: { result: PayInvoiceResponse }) => obj.result
      );
      // loop through the json array and check if the payment preimage is not
      // "0000000000000000000000000000000000000000000000000000000000000000"
      // check the status of the objects in the filtered array if its "SUCCEEDED"
      const unsuccessfulPreimage =
        "0000000000000000000000000000000000000000000000000000000000000000";
      const filteredArray = jsonArray.filter(
        (obj: PayInvoiceResponse) =>
          obj.payment_preimage !== unsuccessfulPreimage &&
          obj.status === "SUCCEEDED"
      ) as PayInvoiceResponse[];
      if (filteredArray.length > 0) {
        Logger.info(`Payment successful: ${filteredArray[0].payment_preimage}`);
        return {
          success: true,
          data: filteredArray,
          error: null,
        };
      } else {
        Logger.error(
          `Payment failed for ${jsonArray[0].payment_hash} with reason: ${
            jsonArray[jsonArray.length - 1].failure_reason
          }`
        );
        return {
          success: false,
          data: null,
          error: new Error("Payment failed"),
        };
      }
    }
  } catch (err) {
    Logger.error({
      message: `Payment failed for invoice: ${invoice}`,
      error: JSON.stringify(err),
    });
    return { success: false, error: err as AxiosError | Error, data: null };
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
