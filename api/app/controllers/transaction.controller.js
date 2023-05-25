const db = require("../sequelize/models");
const { TRANSACTION_STATUS, TRANSACTION_TYPE } = require("../utils/constants");
const { generateTransactionId } = require("../utils/transaction");

const Transaction = db.transaction;
const User = db.user;
const Review = db.review;
const Wallet = db.wallet;

// Create and Save a new Transaction
exports.create = async (req, res) => {
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
      { balance: newWalletBalance, updatedAt: currentTime },
      { where: { id: userWallet.id } }
    );
    return res.send(transactionResult);
  } catch (error) {
    transaction.transactionStatus = TRANSACTION_STATUS.FAILURE;
    Transaction.create(transaction);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Transaction.",
    });
  }
};

exports.findAll = async (req, res) => {
  const { userId, status, type } = req.query;
  // validate fields
  if (!userId) {
    res.status(400).send({
      message: `Missing required fields: userId`,
    });
    return;
  } else if (isNaN(userId)) {
    res.status(400).send({
      message: `userId is of type ${typeof userId}. userId should be a number.`,
    });
    return;
  }
  if (status && !Boolean(TRANSACTION_STATUS[status])) {
    res.status(400).send({
      message: `Invalid status: ${status}`,
    });
    return;
  } else if (type && !Boolean(TRANSACTION_TYPE[type])) {
    res.status(400).send({
      message: `Invalid type: ${type}`,
    });
    return;
  }

  const userWallet = await Wallet.findOne({ where: { userId: userId } });
  if (!userWallet) {
    res.status(404).send({
      message: `Wallet for userId=${userId} does not exist`,
    });
    return;
  }

  let condition = { walletId: userWallet.id };

  if (status) {
    condition = { ...condition, transactionStatus: status };
  }
  if (type) {
    condition = { ...condition, transactionType: type };
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
};
