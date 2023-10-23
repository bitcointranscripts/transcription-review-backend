import { Request, Response } from "express";

import { decode } from "@node-lightning/invoice";

import { Transaction, Wallet } from "../db/models";
import { payInvoice } from "../helpers/lightning";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { PICO_BTC_TO_SATS } from "../utils/constants";
import { generateTransactionId } from "../utils/transaction";

export async function payInvoiceController(req: Request, res: Response) {
  const { invoice, userId } = req.body;
  if (!invoice) {
    return res.status(400).json({ error: "Invoice is required" });
  }

  const prefix = process.env.NODE_ENV === "production" ? "lnbc" : "lntb";
  if (!invoice.startsWith(prefix)) {
    if (invoice.includes("@")) {
      return res.status(400).send({
        error: "Invalid invoice. We do not support lightning addresses!",
      });
    }
    return res.status(400).json({ error: "Invalid invoice" });
  }
  if (!userId) {
    return res.status(400).send({ message: "userId field is required" });
  }

  const decodedInvoice = decode(invoice);
  if (!decodedInvoice || decodedInvoice instanceof Error) {
    return res.status(400).json({ error: "Invalid invoice" });
  }
  const amount = Number(decodedInvoice._value);

  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });

  if (!userWallet) {
    res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${userId} does not exist`,
    });
    return;
  }

  const newAmount = Number(amount / PICO_BTC_TO_SATS);
  const balance = userWallet.balance;
  if (balance < newAmount) {
    return res.status(500).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
  }

  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: 1, //FIXME: reviewId is not nullable
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
    if (response?.error) {
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
    res.status(200).json({ status: 200, message: "Invoice paid successfully" });
  } catch (err) {
    Transaction.update(
      { transactionStatus: TRANSACTION_STATUS.FAILED },
      { where: { id: transactionId } }
    );
    console.error(err);
    return res
      .status(500)
      .json({ status: 500, error: "An error occurred. Could not pay invoice" });
  }
}
