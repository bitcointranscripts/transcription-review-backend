require("dotenv").config();
import { Request, Response } from "express";
const opennode = require("opennode");
opennode.setCredentials(
  process.env.OPENNODE_API_KEY,
  process.env.OPENNODE_API_ENV
);
import { WithdrawalResponse,OpenNodeResponse } from "../types/lightning";

export async function lninvoiceWithdrawal(req: Request, res: Response) {
  const { invoice } = req.body;

  if (invoice === "") {
    return res.status(400).json({ message: "Please enter a valid invoice" });
  }

  const withdrawal = {
    type: "ln",
    address: invoice,
    //amount: 120, - Required if the invoice has no amount set (amount = 0)
    callback_url: "https://example.com/webhook/opennode/withdrawal",
  };

  opennode
    .initiateWithdrawalAsync(withdrawal)
    .then((withdrawal: WithdrawalResponse) => {
      res.status(200).json(withdrawal);
      return;
    })
    .catch((error: any) => {
      res.status(400).json(error);
      return;
    });
}

export const lnurlWithdrawal = async (req: Request, res: Response) => {
  const { amount } = req.body;

  if (typeof amount != "number") {
    res.status(400).json({ message: "You need to enter a valid amount" });
    return;
  }

  //all the logic to confirm if a user's virtual wallet balance is sufficient before generating LNURLwithdraw

  const withdrawal = {
    min_amt: amount,
    max_amt: amount,
    description: "payout of " + amount + " sats from BTC-transcript",
    external_id: "my-external-uuid",
    callback_url: "https://example.com/webhook/opennode",
  };

  opennode
    .createLnUrlWithdrawal(withdrawal)
    .then((response: OpenNodeResponse) => {
      res.status(200).json(response);
      return;
    })
    .catch((error: any) => {
      res.status(400).json(error);
      return;
    });
};
