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

    // the tokens contains both the access_token and the refresh_token
    const tokens = JSON.parse(userTokens);
  

    //set the user alby token with refresh_token
    User.update(
      { albyToken: tokens.refresh_token },
      { where: { id: req.body.userId } }
    )
      .then(() => {
        res
          .status(200)
          .send({ messsage: "Alby withdrawal option activated successfully" });
      })
      .catch((error: any) => {
        res.status(400).send({ error: error.message });
      });
  } catch (error) {
    res.status(400).send({ message: "Something went wrong" });
  }
}

export async function generateInvoice(req: Request, res: Response) {
  //pass the first refresh token, amount and memo as a part of the request parameter

  try {
    //use refreshToken to generate fresh accessToken
    const response: any = await fetchAccessToken(req);
    const tokens: AccessToken = JSON.parse(response);


    //update the user's old refreshToken with the new refreshToken
    await User.update(
      { albyToken: tokens.refresh_token },
      { where: { id: req.body.userId } }
    )

    //fetch an invoice from the user's alby wallet
    const info: any = await fetchInvoice(tokens, req);
    if (JSON.parse(info).error) {
      res.status(400).send({ message: "Something went wrong" });
      return;
    }

    res.status(200).send({
      message: "Invoice generated successfully",
      data: JSON.parse(info),
    });
  } catch (error: any) {
    res.status(400).send({ message: "Something went wrong" });
  }
}
