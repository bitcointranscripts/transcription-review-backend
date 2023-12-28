import axios from "axios";
require("dotenv").config();

export async function sendAlert(
  message: string,
  transcriptTitle?: string | null,
  transcriptUrl?: string | null,
  transcriptHash?: string | null
) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL is not set");
  }

  const content = `New Queuer Action\nMessage: ${message}\nTranscript Title: ${transcriptTitle}\nTranscriptUrl: ${transcriptUrl}\ntranscriptHash: ${transcriptHash}`;

  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { content });
  } catch (error) {
    throw new Error("Error sending alert");
  }
}
