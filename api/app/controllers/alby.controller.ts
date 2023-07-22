import { Request, Response } from "express";
import { fetchUserToken, fetchAccessToken } from "../helpers/albyToken";
import { Settings, User } from "../db/models";
import { fetchInvoice } from "../helpers/fetchInvoice";
import { AccessToken } from "../types/lightning";

export async function saveAlbyToken(req: Request, res: Response) {
  try {
    const { code, userId } = req.body;

    if (!code) {
      res.status(400).send({
        message: "You need to pass an alby authorization code",
      });
    }
    const userTokens = await fetchUserToken(code);
    const tokens: AccessToken = userTokens;

    const userUpdateResponse = await User.update(
      { albyToken: tokens.refresh_token },
      { where: { id: userId } }
    );

    if (userUpdateResponse[0] === 0) {
      return res.status(500).send({
        message: "Error occurred while updating user info",
      });
    }

    const settingsUpdateResponse = await Settings.update(
      { instantWithdrawal: true },
      { where: { userId: userId } }
    );
    if (settingsUpdateResponse[0] === 0) {
      return res.status(500).send({
        message: "Error occurred while updating user settings",
      });
    }
    return res.status(200).send({
      message: "User Alby settings activated successfully",
    });
  } catch (error) {
    res.status(400).send({ message: "Something went wrong" });
  }
}

export async function generateInvoice(req: Request, res: Response) {
  try {
    const response = await fetchAccessToken(req);
    const tokens: AccessToken = response;

    await User.update(
      { albyToken: tokens.refresh_token },
      { where: { id: req.body.userId } }
    );

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
