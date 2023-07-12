require("dotenv").config();
const request = require("request");
import { Request } from "express";



//fetch the access token for Alby using the code
export async function fetchUserToken(code: string) {
    return new Promise((resolve, reject) => {
      try {
        var options = {
          method: "POST",
          url: process.env.ALBY_TOKEN_API,
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                process.env.ALBY_CLIENT_ID + ":" + process.env.ALBY_SECRET_ID
              ).toString("base64"),
          },
          formData: {
            code: code,
            grant_type: "authorization_code",
            redirect_uri: process.env.REDIRECT_URL,
          },
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
  

// fetch the access token for Alby using the refreshtoken
export async function fetchAccessToken(req: Request) {
    return new Promise((resolve, reject) => {
      try {
        var options = {
          method: "POST",
          url: process.env.ALBY_TOKEN_API,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization:
              "Basic " +
              Buffer.from(
                process.env.ALBY_CLIENT_ID + ":" + process.env.ALBY_SECRET_ID
              ).toString("base64"),
          },
          formData: {
            refresh_token: req.body.refreshToken,
            grant_type: "refresh_token",
          },
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