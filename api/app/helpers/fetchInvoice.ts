import {Request} from "express"
require("dotenv").config();
import { AccessToken, AlbyInvoice } from "../types/lightning";
import axios, { AxiosResponse } from "axios";


const ALBY_API_URL = process.env.ALBY_API_URL
if(!ALBY_API_URL){
  throw new Error("Alby api url variable not set");
}

export async function fetchInvoice(tokens: AccessToken, req: Request) {
  try {
    const apiUrl = process.env.ALBY_API_URL + "/invoices";
    const requestBody = {
      amount: parseInt(req.body.amount),
      memo: req.body.memo,
    };
    const config = {
      headers: {
        Authorization: "Bearer " + tokens.access_token,
        "Content-Type": "application/json",
      },
    };

    const response: AxiosResponse = await axios.post(apiUrl, requestBody, config);
    return response.data as AlbyInvoice;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
