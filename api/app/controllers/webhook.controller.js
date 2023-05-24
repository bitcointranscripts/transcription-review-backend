const db = require("../sequelize/models");
const {
  TRANCRIPT_STATUS,
  TRANSACTION_TYPE,
  PR_EVENT_ACTIONS,
  TRANSACTION_STATUS,
} = require("../utils/constants");
const { calculateCreditAmount } = require("../utils/review.inference");

const Review = db.review;
const Transcript = db.transcript;
const Transaction = db.transaction;
const User = db.user;
const Wallet = db.wallet;

// create a new transaction when a review is merged
async function createCreditTransaction(review, amount) {
  const dbTransaction = await db.sequelize.transaction();
  const currentTime = new Date();
  const user = await User.findByPk(existingReview.userId);
  const userWallet = await Wallet.findOne({
    where: { userId: user.id },
  });
  try {
    const newWalletBalance = userWallet.balance + +amount;
    const creditTransaction = {
      reviewId: review.id,
      walletId: userWallet.id,
      amount: +amount,
      transactionType: TRANSACTION_TYPE.CREDIT,
      transactionStatus: TRANSACTION_STATUS.SUCCESS,
      timestamp: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
    await Transaction.create(creditTransaction, {
      transaction: dbTransaction,
    });
    await userWallet.update(
      {
        balance: newWalletBalance,
        updatedAt: currentTime,
      },
      { transaction: dbTransaction }
    );
    await dbTransaction.commit();
  } catch (error) {
    console.log(error);
    await dbTransaction.rollback();
    const failedTransaction = {
      reviewId: review.id,
      walletId: userWallet.id,
      amount: +amount,
      transactionType: TRANSACTION_TYPE.CREDIT,
      transactionStatus: TRANSACTION_STATUS.FAILED,
      timestamp: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    };
    await Transaction.create(failedTransaction);
    throw new Error(error);
  }
}

exports.create = async (req, res) => {
  const pull_request = req.body;

  //check if req.body return anything
  if (!pull_request) {
    res.status(500).send({
      message: "No pull request data found in the request body.",
    });
  }

  const action = pull_request.action;
  const isMerged = pull_request.pull_request?.merged;
  const html_url = pull_request.pull_request?.html_url;
  const currentTime = new Date();

  // Check if the PR URL exists in the database
  const existingReview = await Review.findOne({ where: { pr_url: html_url } });

  if (!existingReview) {
    return res.status(404).send({
      message: `Review with pr_url=${html_url} not found`,
    });
  }

  // Check if the action is closed and the PR is merged
  if (action === PR_EVENT_ACTIONS.CLOSED && isMerged) {
    try {
      // PR is merged, update the mergedAt timestamp
      existingReview.mergedAt =
        pull_request.pull_request.merged_at ?? currentTime;
      await existingReview.save();

      // find and update the associated transcript
      const associatedTranscript = await Transcript.findByPk(
        existingReview.transcriptId
      );
      associatedTranscript.archivedAt = currentTime;
      await associatedTranscript.save();

      const creditAmount = await calculateCreditAmount(associatedTranscript);
      await createCreditTransaction(existingReview, creditAmount);

      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).send({
        message: `Error: ${
          error?.message ?? "unable to update review or associated transcript"
        }`,
      });
    }
  } else if (action === PR_EVENT_ACTIONS.CLOSED && !isMerged) {
    try {
      // PR is merged, update the archivedAt timestamp
      existingReview.archivedAt = currentTime;
      await existingReview.save();

      // find and update the associated transcript
      const associatedTranscript = await Transcript.findByPk(
        existingReview.transcriptId
      );
      associatedTranscript.claimedBy = null;
      associatedTranscript.status = TRANCRIPT_STATUS.QUEUED;
      await associatedTranscript.save();

      res.sendStatus(200);
    } catch (error) {
      res.status(500).send({
        message: `Error: ${
          error?.message ?? "unable to update review or associated transcript"
        }`,
      });
    }
  } else {
    res.sendStatus(200);
  }
};
