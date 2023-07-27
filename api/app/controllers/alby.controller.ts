import { Request, Response } from "express";

import { decode } from "@node-lightning/invoice";

import { Settings, Transaction, User, Wallet } from "../db/models";
import { fetchAccessToken, fetchUserToken } from "../helpers/albyToken";
import { fetchInvoice } from "../helpers/fetchInvoice";
import { payInvoice } from "../helpers/lightning";
import { AccessToken } from "../types/lightning";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { PICO_BTC_TO_SATS } from "../utils/constants";
import { generateTransactionId } from "../utils/transaction";

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
    res.status(500).send({ message: "Something went wrong" });
  }
}

export async function payAlbyInvoice(req: Request, res: Response) {
  const { userId, refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).send({ message: "Please enter a valid refresh token" });
    return;
  }

  const albyResponse = await fetchAccessToken(refreshToken);
  const tokens: AccessToken = albyResponse;

  await User.update(
    { albyToken: tokens.refresh_token },
    { where: { id: userId } }
  );
  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });
  if (!userWallet) {
    return res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${userId} does not exist`,
    });
  }

  const info: any = await fetchInvoice(tokens, req);
  const albyInvoiceData = JSON.parse(info);
  const invoice = albyInvoiceData.payment_request;

  if (albyInvoiceData.error) {
    return res.status(500).send({ message: "Something went wrong" });
  }

  const decodedInvoice = decode(invoice);
  const amount = Number(decodedInvoice._value);
  const newAmount = Number(amount / PICO_BTC_TO_SATS);

  const balance = userWallet.balance;
  if (balance < newAmount) {
    return res.status(403).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
  }

  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: 1, // FIXME: reviewId is not nullable
    amount: newAmount,
    transactionType: TRANSACTION_TYPE.DEBIT,
    transactionStatus: TRANSACTION_STATUS.PENDING,
    walletId: userWallet.id,
    timestamp: new Date(),
  };
  try {
    const result = await Transaction.create(transaction);
    if (!result) {
      throw new Error("Transaction failed");
    }
    const response = await payInvoice(invoice);
    if (!response) {
      throw new Error("Payment failed");
    }
    await Transaction.update(
      { transactionStatus: TRANSACTION_STATUS.SUCCESS },
      { where: { id: transactionId } }
    );
    await Wallet.update(
      { balance: balance - newAmount },
      { where: { id: userWallet.id } }
    );
    res.status(200).json({ message: "Invoice paid successfully" });
  } catch (err) {
    Transaction.update(
      { transactionStatus: TRANSACTION_STATUS.FAILED },
      { where: { id: transactionId } }
    );
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred. Could not pay invoice" });
  }
}
