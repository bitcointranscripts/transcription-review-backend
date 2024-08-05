import { Request, Response } from "express";

import { decode } from "@node-lightning/invoice";

import { Review, Transaction, Wallet } from "../db/models";
import { payInvoice } from "../helpers/lightning";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { PICO_BTC_TO_SATS } from "../utils/constants";
import { generateTransactionId } from "../utils/transaction";
import { sequelize } from "../db";

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

  const sequelizeTransaction = await sequelize.transaction();
  try {
    // We need to choose a random user review to associate with the transaction
    // given that reviewId cannot be null and user will always have a review
    // after a successful credit transaction
    const review = await Review.findOne({
      where: {
        userId,
      },
    });
    if (!review) {
      throw new Error(
        `Could not create transaction: review with userId=${userId} does not exist`
      );
    }
    const transactionId = generateTransactionId();
    const transaction = {
      id: transactionId,
      reviewId: review?.id,
      amount: newAmount,
      transactionType: TRANSACTION_TYPE.DEBIT,
      transactionStatus: TRANSACTION_STATUS.PENDING,
      walletId: userWallet.id,
      timestamp: new Date(),
    };
    const result = await Transaction.create(transaction, {
      transaction: sequelizeTransaction,
    });
    if (!result) {
      throw new Error("Transaction failed");
    }

    const response = await payInvoice(invoice);
    if (
      (response?.error && response?.error instanceof Error) ||
      !response?.data
    ) {
      throw new Error(response?.error?.message || "Payment failed");
    }

    await Transaction.update(
      { transactionStatus: TRANSACTION_STATUS.SUCCESS },
      { where: { id: transactionId }, transaction: sequelizeTransaction }
    );
    await Wallet.update(
      { balance: balance - newAmount },
      { where: { id: userWallet.id }, transaction: sequelizeTransaction }
    );
    sequelizeTransaction.commit();
    res.status(200).json({
      status: 200,
      message: "Invoice paid successfully",
      data: {
        transactionId,
        paymentPreimage: response.data[0].payment_preimage,
        paymentPash: response.data[0].payment_hash,
      },
    });
  } catch (err) {
    sequelizeTransaction.rollback();
    console.error(err);
    return res
      .status(500)
      .json({ status: 500, error: "An error occurred. Could not pay invoice" });
  }
}
