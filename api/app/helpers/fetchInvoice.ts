import {Request} from "express"
require("dotenv").config();
const request = require("request");
import { AccessToken } from "../types/lightning";

//defining the accessToken response interface


export async function fetchInvoice(tokens: AccessToken, req: Request) {
    return new Promise((resolve, reject) => {
      try {
        var options = {
          method: "POST",
          url: process.env.ALBY_API_URL + "/invoices",
          headers: {
            Authorization: "Bearer " + tokens.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseInt(req.body.amount),
            memo: req.body.memo,
          }),
        };
        request(options, function (error: any, response: any, body: any) {
          if (error) {
            reject(error.message);
          } else {
            resolve(body);
          }
        });
      } catch (error: any) {
        reject(error.message);
      }
    });
  }