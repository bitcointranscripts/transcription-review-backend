import { Request, Response } from "express";

import { Review } from "../sequelize/models/review";
import { Transaction } from "../sequelize/models/transaction";
import { Wallet } from "../sequelize/models/wallet";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../utils/constants";
import { generateTransactionId } from "../utils/transaction";
import { ObjectValues } from "../utils/types";

type TRANSACTION_TYPE_VALUES = ObjectValues<typeof TRANSACTION_STATUS>;

// Create and Save a new Transaction
export async function create(req: Request, res: Response) {
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
  if (req.body.reviewId) {
    const review = await Review.findOne({
      where: {
        id: req.body.reviewId,
      },
    });
    if (!review) {
      res.status(404).send({
        message: `Could not create transaction: review with id=${req.body.reviewId} does not exist`,
      });
      return;
    }
  }

  // check if user wallet exists
  const userWallet = await Wallet.findOne({
    where: {
      userId: req.body.userId,
    },
  });
  if (!userWallet) {
    res.status(404).send({
      message: `Could not create transaction: wallet with for userId=${req.body.userId} does not exist`,
    });
    return;
  }
  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    reviewId: req.body.reviewId ?? null,
    amount: +req.body.amount,
    transactionType: req.body.transactionType,
    transactionStatus: TRANSACTION_STATUS.SUCCESS as TRANSACTION_TYPE_VALUES,
    walletId: Number(userWallet.id),
    timestamp: currentTime,
  };

  const newWalletBalance =
    transaction.transactionType === TRANSACTION_TYPE.CREDIT
      ? userWallet.balance + transaction.amount
      : userWallet.balance - transaction.amount;

  try {
    const transactionResult = await Transaction.create(transaction);
    await Wallet.update(
      { balance: newWalletBalance, updatedAt: currentTime },
      { where: { id: userWallet.id } }
    );
    return res.send(transactionResult);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some error occurred while creating the Transaction.";
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
      message: `Wallet for userId=${userId} does not exist`,
    });
    return;
  }

  let condition: {
    walletId: string | number;
    transactionStatus?: ObjectValues<typeof TRANSACTION_STATUS>;
    transactionType?: ObjectValues<typeof TRANSACTION_TYPE>;
  } = { walletId: userWallet.id };
  if (status) {
    if (
      !Boolean(
        TRANSACTION_STATUS[
          String(status).toUpperCase() as keyof typeof TRANSACTION_STATUS
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
      transactionStatus: String(status) as ObjectValues<
        typeof TRANSACTION_STATUS
      >,
    };
  }
  if (type) {
    if (
      type &&
      !Boolean(
        TRANSACTION_TYPE[
          String(type).toUpperCase() as keyof typeof TRANSACTION_TYPE
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
      transactionType: String(type) as ObjectValues<typeof TRANSACTION_TYPE>,
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
