import { Request, Response } from "express";
import { fetchUserToken, fetchAccessToken } from "../helpers/albyToken";
import { User } from "../db/models";
import { fetchInvoice } from "../helpers/fetchInvoice";
import { AccessToken } from "../types/lightning";

//save alby refresh token the first time it is substituted for the code
export async function saveAlbyToken(req: Request, res: Response) {
  try {
    const { code } = req.body;
    const userTokens: any = await fetchUserToken(code);
    const tokens = JSON.parse(userTokens);

    // the tokens contains both the access_token and the refresh_token

    // User.findOne(id).update({
    //   settings:tokens.refresh_token
    // }).then(()=>{
    //   res.status(200).json({"messsage":"Alby wallet activated successfully"})
    // }).catch((error:any)=>{
    //   res.status(400).json({"error":error.message})
    // })

  } catch (error) {
    res.status(400).json({ message: "Something's wrong" });
  }
}

export async function generateInvoice(req: Request, res: Response) {

  //pass the first refresh token, amount and memo as a part of the request parameter

  try {
    //use refreshToken to generate fresh accessToken
    const response: any = await fetchAccessToken(req);
    const tokens: AccessToken = JSON.parse(response);

    //update the user's old refreshToken with the new refreshToken
    // const { data, error } = await User.findOne(userId).update({
    //   settings: tokens.refresh_token,
    // });

    // if (Error) {
    //   res.status(400).json({ message: "Something wrong with fetching data" });
    //   return;
    // }

    const info: any = await fetchInvoice(tokens, req);
    if (JSON.parse(info).error) {
      res.status(400).json({ message: "Something went wrong" });
      return;
    }

    res
      .status(200)
      .json({
        message: "Invoice generated successfully",
        data: JSON.parse(info),
      });
  } catch (error: any) {
    res.status(400).json({ message: "Something went wrong" });
  }
}
