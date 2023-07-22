require("dotenv").config();
import { Request, Response } from "express";
const opennode = require("opennode");
opennode.setCredentials(
  process.env.OPENNODE_API_KEY,
  process.env.OPENNODE_API_ENV
);
import { WithdrawalResponse, OpenNodeResponse } from "../types/lightning";
import { decode } from "@node-lightning/invoice";
import { INVOICEEXPIRYTIME } from "../utils/constants";
import { Wallet, Transaction } from "../db/models";
import { generateTransactionId } from "../utils/transaction";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";

export async function lninvoiceWithdrawal(req: Request, res: Response) {
  const { invoice, userId } = req.body;

  if (!invoice) {
    return res.status(400).send({ message: "Please enter a valid invoice" });
  }

  let result = decode(invoice);
  let amount = Number(result._value);
  let timestamp = result.timestamp * 1000;

  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });

  if (!userWallet) {
    res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${userId} does not exist`,
    });
    return;
  }

  const balance = userWallet.balance;

  if (balance * 10000 < amount) {
    res.status(400).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
    return;
  }

  const expiryPeriod = timestamp + Number(INVOICEEXPIRYTIME);
  if (expiryPeriod < Date.now()) {
    res.status(400).send({
      message: "The invoice is no longer valid for payment as it has timed out",
    });
    return;
  }

  //create a debit transaction
  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: 0,
    amount: +amount,
    transactionType: TRANSACTION_TYPE.DEBIT,
    transactionStatus: TRANSACTION_STATUS.PENDING,
    walletId: userWallet.id,
    timestamp: new Date(),
  };

  try {
    await Transaction.create(transaction);
    const withdrawal = {
      type: "ln",
      address: invoice,
      callback_url: "https://example.com/webhook/opennode/withdrawal",
    };

    const response: WithdrawalResponse = await opennode.initiateWithdrawalAsync(
      withdrawal
    );
    res.status(200).json(response);
    return;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some error occurred while creating the Transaction";
    transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
    Transaction.create(transaction);
    res.status(500).send({
      message,
    });
  }
}

export const lnurlWithdrawal = async (req: Request, res: Response) => {
  const { amount, userId } = req.body;

  if (typeof amount != "number") {
    res.status(400).send({ message: "You need to enter a valid amount" });
    return;
  }

  const userWallet = await Wallet.findOne({
    where: { userId: userId },
  });

  if (!userWallet) {
    res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${userId} does not exist`,
    });
    return;
  }

  const balance = userWallet.balance;

  if (balance < amount) {
    res.status(400).send({
      message:
        "You currently do not have sufficient balance to withdraw this amount",
    });
    return;
  }

  //create a debit transaction
  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: 0,
    amount: +amount,
    transactionType: TRANSACTION_TYPE.DEBIT,
    transactionStatus: TRANSACTION_STATUS.PENDING,
    walletId: userWallet.id,
    timestamp: new Date(),
  };

  try {
    await Transaction.create(transaction);
    const withdrawal = {
      min_amt: amount,
      max_amt: amount,
      description: "payout of " + amount + " sats from BTC-transcript",
      external_id: transaction.id,
      callback_url: "https://example.com/webhook/opennode",
    };

    const response: OpenNodeResponse = await opennode.createLnUrlWithdrawal(
      withdrawal
    );
    res.status(200).send(response);
    return;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some error occurred while creating the Transaction";
    transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
    Transaction.create(transaction);
    res.status(500).send({
      message,
    });
  }
};
