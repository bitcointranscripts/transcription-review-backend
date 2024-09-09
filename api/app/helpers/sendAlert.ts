import axios from "axios";
import { Logger } from "./logger";
require("dotenv").config();
import { DELAY_IN_BETWEEN_REQUESTS } from "../utils/constants";
import Bottleneck from "bottleneck";

interface DiscordAlertContent {
  message: string;
  isError: boolean;
  transcriptTitle?: string | null;
  speakers?: string;
  transcriptUrl?: string;
  type?: "transaction" | "transcript";
}

interface DiscordMessage {
  webhookUrl: string;
  content: string;
}

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

export async function sendAlert({
  message,
  isError,
  transcriptTitle,
  speakers,
  transcriptUrl,
  type,
}: DiscordAlertContent) {

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
    switch (type) {
      case "transaction":
        content = `❌ ${message}\nTitle: ${transcriptTitle}\nLink: ${transformUrl(
          transcriptUrl
        )}`;
        break;
      case "transcript":
        content = `❌ Transcript not added to the Queue\n${message}`;
        break;
      default:
        content = `ℹ️ Unknown alert type: ${type}\n${message}`;
        break;
    }
  } else {
    // Only transform the URL when isError is false
    const transformedUrl = transformUrl(transcriptUrl);
    content = `🤖 ${message}\nTitle: ${transcriptTitle}\nSpeakers: ${speakers}\nLink: ${transformedUrl}`;
  }

  const payload = { webhookUrl, content };

  if (process.env.NODE_ENV === "development") {
    Logger.info("Alert: ", payload)
    return;
  }
  
  limiter.schedule(() => sendDiscordMessage(payload));
}
