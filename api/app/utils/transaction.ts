import { sequelize } from "../db";
import { Review, Transaction, User, Wallet } from "../db/models";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../types/transaction";
import { TranscriptAttributes } from "../types/transcript";
import { SATS_REWARD_RATE_PER_WORD } from "./constants";
import { calculateWordDiff } from "./review.inference";

function generateTransactionId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).substr(2, 5); // Generate a random string

  return timestamp + randomString;
}

async function calculateCreditAmount(
  associatedTranscript: TranscriptAttributes
) {
  const { totalDiff, totalWords } = await calculateWordDiff(
    associatedTranscript
  );
  const rewardForWords = totalWords * SATS_REWARD_RATE_PER_WORD;
  const rewardForDiff = totalDiff * SATS_REWARD_RATE_PER_WORD;
  const creditAmount = rewardForWords + rewardForDiff;
  return creditAmount;
}

// create a new credit transaction when a review is merged
async function createCreditTransaction(review: Review, amount: number) {
  const dbTransaction = await sequelize.transaction();
  const currentTime = new Date();

  const user = await User.findByPk(review.userId);
  if (!user) throw new Error(`Could not find user with id=${review.userId}`);

  const userWallet = await Wallet.findOne({
    where: { userId: user.id },
  });
  if (!userWallet)
    throw new Error(`Could not get wallet for user with id=${user.id}`);

  const newWalletBalance = userWallet.balance + Math.round(+amount);
  const creditTransaction = {
    id: generateTransactionId(),
    reviewId: review.id,
    walletId: userWallet.id,
    amount: Math.round(+amount),
    transactionType: TRANSACTION_TYPE.CREDIT,
    transactionStatus: TRANSACTION_STATUS.SUCCESS,
    timestamp: currentTime,
  };
  try {
    await Transaction.create(creditTransaction, {
      transaction: dbTransaction,
    });
    await userWallet.update(
      {
        balance: newWalletBalance,
      },
      { transaction: dbTransaction }
    );
    await dbTransaction.commit();
    return creditTransaction;
  } catch (error) {
    await dbTransaction.rollback();
    const failedTransaction = {
      ...creditTransaction,
      transactionStatus: TRANSACTION_STATUS.FAILED,
    };
    await Transaction.create(failedTransaction);

    throw error;
  }
}

export {
  generateTransactionId,
  calculateCreditAmount,
  createCreditTransaction,
};
