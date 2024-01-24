import axios from "axios";
import { Logger } from "./logger";
require("dotenv").config();
import { DELAY_IN_BETWEEN_REQUESTS } from "../utils/constants";
import Bottleneck from "bottleneck";

function transformUrl(transcriptUrl?: string | null): string | null {
  if (!transcriptUrl) {
    Logger.error("Error transforming URL: URL not found");
    return null;
  }

  // Extract necessary parts from the transcriptUrl
  const { pathname } = new URL(transcriptUrl);
  const transcriptPath = pathname.split("/").slice(5).join("/");

  // Construct the correct URL using template literals
  const transcriptUrlPath = `https://btctranscripts.com/${transcriptPath}`;

  // Remove .md from the end of the URL
  const transformedUrlPath = transcriptUrlPath.replace(/\.md$/, "");

  return transformedUrlPath;
}

interface DiscordMessage {
  webhookUrl: string;
  content: string;
}
const limiter = new Bottleneck({
  minTime: DELAY_IN_BETWEEN_REQUESTS, // 3 seconds
});

async function sendDiscordMessage({ webhookUrl, content }: DiscordMessage) {
  try {
    await axios.post(webhookUrl, { content });
  } catch (error) {
    Logger.error(error);
  }
}

export async function sendAlert(
  message: string,
  isError: boolean = false,
  transcriptTitle?: string | null,
  speakers?: string,
  transcriptUrl?: string
) {
  //bypass alerts in development
  if (process.env.NODE_ENV === "development") {
    return;
  }

  // Use ternary operator for setting webhookUrl
  const webhookUrl = isError
    ? process.env.DISCORD_ERROR_WEBHOOK_URL
    : process.env.DISCORD_TRANSCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    Logger.error("Error sending alert: Webhook URL not found");
    return;
  }
  let content;
  if (isError) {
    content = `❌ Transcript not added to the Queue\n${message}`;
  } else {
    // Only transform the URL when isError is false
    const transformedUrl = transformUrl(transcriptUrl);
    content = `🤖 ${message}\nTitle: ${transcriptTitle}\nSpeakers: ${speakers}\nLink: ${transformedUrl}`;
  }

  const payload = { webhookUrl, content };
  limiter.schedule(() => sendDiscordMessage(payload));
}
