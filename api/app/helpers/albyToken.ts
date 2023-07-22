require("dotenv").config();
import { Request } from "express";
import { AlbyTokens } from "../types/lightning";
import axios from "axios";

const ALBY_API_TOKEN = process.env.ALBY_API_TOKEN || "";
const ALBY_REDIRECT_URL = process.env.ALBY_REDIRECT_URL || "";
const ALBY_CLIENT = process.env.ALBY_CLIENT_ID || "";
const ALBY_SECRET = process.env.ALBY_SECRET_ID || "";
if (!ALBY_API_TOKEN || !ALBY_REDIRECT_URL || !ALBY_CLIENT || !ALBY_SECRET) {
  throw new Error("Alby environment variable not set");
}
export async function fetchUserToken(code: string) {
  try {
    const response = await axios.post(
      ALBY_API_TOKEN,
      new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        redirect_uri: ALBY_REDIRECT_URL,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(ALBY_CLIENT + ":" + ALBY_SECRET).toString("base64"),
        },
      }
    );
    return response.data as AlbyTokens;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function fetchAccessToken(req: Request) {
  try {
    const response = await axios.post(
      ALBY_API_TOKEN,
      new URLSearchParams({
        refresh_token: req.body.refreshToken,
        grant_type: "refresh_token",
      }),
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization:
            "Basic " +
            Buffer.from(ALBY_CLIENT + ":" + ALBY_SECRET).toString("base64"),
        },
      }
    );
    return response.data as AlbyTokens;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
