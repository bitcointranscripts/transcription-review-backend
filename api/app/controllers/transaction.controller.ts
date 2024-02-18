import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transaction, Transcript, User, Wallet } from "../db/models";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { DB_START_PAGE, DB_TXN_QUERY_LIMIT } from "../utils/constants";
import { generateTransactionId } from "../utils/transaction";
import { addCreditTransactionQueue } from "../utils/cron";
import { Logger } from "../helpers/logger";

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

export const getAllTransactions = async (req: Request, res: Response) => {
  const status = req.query.status as TRANSACTION_STATUS;
  const type = req.query.type as TRANSACTION_TYPE;
  const txid = req.query.id as string;
  const userSearch = req.query.user as string;
  const page: number = Number(req.query.page) || DB_START_PAGE;
  const limit: number = Number(req.query.limit) || DB_TXN_QUERY_LIMIT;
  const offset: number = page * limit;

  const txnCondition: {
    transactionStatus?: TRANSACTION_STATUS;
    transactionType?: TRANSACTION_TYPE;
    id?: string;
  } = {};

  const userCondition: {
    [Op.or]?: {
      email?: { [Op.iLike]: string };
      githubUsername?: { [Op.iLike]: string };
    }[];
  } = {};

  if (txid) {
    txnCondition.id = txid;
  }

  if (
    status &&
    Object.keys(TRANSACTION_STATUS).includes(status.toUpperCase())
  ) {
    txnCondition.transactionStatus = status.toString() as TRANSACTION_STATUS;
  } else if (status) {
    return res.status(400).send({ message: `Invalid status: ${status}` });
  }

  if (type && Object.keys(TRANSACTION_TYPE).includes(type.toUpperCase())) {
    txnCondition.transactionType = type.toString() as TRANSACTION_TYPE;
  } else if (type) {
    return res.status(400).send({ message: `Invalid type: ${type}` });
  }

  if (userSearch) {
    const searchCondition = { [Op.iLike]: `%${userSearch.toLowerCase()}%` };
    userCondition[Op.or] = [
      { email: searchCondition },
      { githubUsername: searchCondition },
    ];
  }

  try {
    const transactions = await Transaction.findAll({
      limit,
      offset,
      attributes: {
        exclude: ["walletId"],
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Wallet,
          required: true,
          attributes: ["id", "balance", "updatedAt"],
          include: [
            {
              model: User,
              attributes: ["id", "githubUsername", "email", "permissions"],
              where: userCondition,
              required: true,
            },
          ],
        },
      ],
      where: txnCondition,
    });

    const transactionCount = await Transaction.count({
      distinct: true,
      where: txnCondition,
      include: [
        {
          model: Wallet,
          required: true,
          include: [
            {
              model: User,
              where: userCondition,
              required: true,
            },
          ],
        },
      ],
    });
    const totalPages = Math.ceil(transactionCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const response = {
      totalTransactions: transactionCount,
      totalPages,
      page: page + 1,
      itemsPerPage: limit,
      hasNextPage,
      hasPreviousPage,
      data: transactions,
    };
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const processUnpaidReviewTransaction = async (
  req: Request,
  res: Response
) => {
  const reviewId = req.body.reviewId;
  if (!reviewId) {
    return res.status(400).send({ message: "Review id is required" });
  }
  try {
    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: Transcript,
          required: true,
        },
      ],
    });
    if (!review) {
      return res
        .status(404)
        .send({ message: `Review with id=${reviewId} not found` });
    }
    const unpaidReviewTransaction = await Transaction.findOne({
      where: {
        reviewId: reviewId,
      },
    });
    if (unpaidReviewTransaction) {
      return res.status(200).send({
        message: `Transaction for review - ${reviewId} already exists`,
      });
    }

    await addCreditTransactionQueue(review.transcript, review);
    return res.status(200).send({
      message: `Processing credit transaction for review ${reviewId}`,
    });
  } catch (error) {
    Logger.error("Error in processing unpaid review transaction", error);
    res
      .status(500)
      .send({ message: "Error processing unpaid review transaction" });
  }
};
