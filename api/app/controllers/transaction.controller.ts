import { Request, Response } from "express";

import { Review, Transaction, Wallet } from "../db/models";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { generateTransactionId } from "../utils/transaction";

// Create and Save a new Transaction
export async function create(req: Request, res: Response) {
  const { reviewId, userId, amount, transactionType } = req.body;
  // check if any fields are empty
  const requiredFields = ["userId", "amount", "transactionType"];
  if (
    req.body.transactionType &&
    req.body.transactionType === TRANSACTION_TYPE.CREDIT
  ) {
    requiredFields.push("reviewId");
  }
  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length) {
    res.status(400).send({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
    return;
  }

  const currentTime = new Date();

  // check if review exists
  if (reviewId) {
    const review = await Review.findOne({
      where: {
        id: Number(reviewId),
      },
    });
    if (!review) {
      res.status(404).send({
        message: `Could not create transaction: review with id=${reviewId} does not exist`,
      });
      return;
    }
  }

  // check if user wallet exists
  const userWallet = await Wallet.findOne({
    where: {
      userId: Number(userId),
    },
  });
  if (!userWallet) {
    res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${userId} does not exist`,
    });
    return;
  }
  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: reviewId ?? null,
    amount: +amount,
    transactionType: transactionType,
    transactionStatus: TRANSACTION_STATUS.SUCCESS,
    walletId: userWallet.id,
    timestamp: currentTime,
  };

  const newWalletBalance =
    transaction.transactionType === TRANSACTION_TYPE.CREDIT
      ? userWallet.balance + transaction.amount
      : userWallet.balance - transaction.amount;

  try {
    const transactionResult = await Transaction.create(transaction);
    await Wallet.update(
      { balance: newWalletBalance },
      { where: { id: userWallet.id } }
    );
    return res.send(transactionResult);
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

export async function findAll(req: Request, res: Response) {
  const { userId, status, type } = req.query;
  // validate fields
  if (!userId) {
    res.status(400).send({
      message: `Missing required fields: userId`,
    });
    return;
  } else if (isNaN(Number(userId))) {
    res.status(400).send({
      message: `userId is of type ${typeof userId}. userId should be a number.`,
    });
    return;
  }
  const userWallet = await Wallet.findOne({
    where: { userId: Number(userId) },
  });
  if (!userWallet) {
    res.status(404).send({
      message: `Wallet for userId=${userId.toString()} does not exist`,
    });
    return;
  }

  let condition: {
    walletId: string;
    transactionStatus?: TRANSACTION_STATUS;
    transactionType?: TRANSACTION_TYPE;
  } = { walletId: userWallet.id };
  if (status) {
    if (
      !Boolean(
        TRANSACTION_STATUS[
          status.toString().toUpperCase() as keyof typeof TRANSACTION_STATUS
        ]
      )
    ) {
      res.status(400).send({
        message: `Invalid status: ${status}`,
      });
      return;
    }
    condition = {
      ...condition,
      transactionStatus: status.toString() as TRANSACTION_STATUS,
    };
  }
  if (type) {
    if (
      type &&
      !Boolean(
        TRANSACTION_TYPE[
          type.toString().toUpperCase() as keyof typeof TRANSACTION_TYPE
        ]
      )
    ) {
      res.status(400).send({
        message: `Invalid type: ${type}`,
      });
      return;
    }
    condition = {
      ...condition,
      transactionType: type.toString() as TRANSACTION_TYPE,
    };
  }

  Transaction.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transactions.",
      });
    });
}
