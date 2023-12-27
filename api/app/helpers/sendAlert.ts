import axios from "axios";
require("dotenv").config();

export async function sendAlert(
  message: string,
  transcriptTitle?: string,
  transcriptUrl?: string,
  transcriptHash?: string
) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL is not set");
  }

  const time = new Date().toLocaleString();
  const content = `New Queuer Action\nMessage: ${message}\nTranscript Title: ${transcriptTitle}\nTime: ${time}\nTranscriptUrl: ${transcriptUrl}\ntranscriptHash: ${transcriptHash}}`;

  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { content });
  } catch (error) {
    throw new Error("Error sending alert");
  }
}
