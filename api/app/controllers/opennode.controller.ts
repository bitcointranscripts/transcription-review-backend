require("dotenv").config();
import { Request, Response } from "express";
import { Wallet } from "../db/models";
const opennode = require("opennode");
opennode.setCredentials(
  process.env.OPENNODE_API_KEY,
  process.env.OPENNODE_API_ENV
);
import { WithdrawalResponse, OpenNodeResponse } from "../types/lightning";
import { decode } from "@node-lightning/invoice";

export async function lninvoiceWithdrawal(req: Request, res: Response) {
  const { invoice, userId } = req.body;

  if (invoice === "") {
    return res.status(400).send({ message: "Please enter a valid invoice" });
  }

  //decode the invoice to check its amount
  let result = decode(invoice);
  let amount = Number(result._value); //value of the invoice in bigint millisats, 1 sat = 10000n
  let timestamp = result.timestamp * 1000; //get the time the invoice was generated

  //check if the user's balance is sufficient to pay the invoice
  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });

  const balance = userWallet?.balance;

  if (balance! * 10000 < amount) {
    res.status(400).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
    return;
  }

  //check if the invoice was created more than five minutes ago
  if (timestamp + 5 * 60 * 1000 < Date.now()) {
    res.status(400).send({
      message: "The invoice is no longer valid for payment as it has timed out",
    });
    return;
  }

  const withdrawal = {
    type: "ln",
    address: invoice,
    callback_url: "https://example.com/webhook/opennode/withdrawal",
  };

  opennode
    .initiateWithdrawalAsync(withdrawal)
    .then((withdrawal: WithdrawalResponse) => {
      res.status(200).json(withdrawal);
      return;
    })
    .catch((error: any) => {
      res.status(400).send(error);
      return;
    });
}

export const lnurlWithdrawal = async (req: Request, res: Response) => {
  const { amount, userId } = req.body;

  if (typeof amount != "number") {
    res.status(400).send({ message: "You need to enter a valid amount" });
    return;
  }

  //logic to check user's virtual wallet balance before generating LNURLwithdraw
  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });

  const balance = userWallet?.balance;

  if (balance! < amount) {
    res.status(400).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
    return;
  }

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
      res.status(200).send(response);
      return;
    })
    .catch((error: any) => {
      res.status(400).send(error);
      return;
    });
};
