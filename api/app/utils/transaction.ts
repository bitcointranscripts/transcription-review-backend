import { TranscriptAttributes } from "../types/transcript";
import { SATS_REWARD_RATE_PER_WORD } from "./constants";
import { calculateWordDiff } from "./review.inference";

function generateTransactionId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).substr(2, 5); // Generate a random string

  return timestamp + randomString;
}

async function calculateCreditAmount(associatedTranscript: TranscriptAttributes) {
  const { totalDiff, totalWords } = await calculateWordDiff(
    associatedTranscript
  );
  const rewardForWords = totalWords * SATS_REWARD_RATE_PER_WORD;
  const rewardForDiff = totalDiff * SATS_REWARD_RATE_PER_WORD;
  const creditAmount = rewardForWords + rewardForDiff;
  return creditAmount;
}

export { generateTransactionId, calculateCreditAmount };
