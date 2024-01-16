import axios from "axios";
require("dotenv").config();

function transformUrl(transcriptUrl?: string | null): string | null {
  if (!transcriptUrl) {
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

export async function sendAlert(
  message: string,
  isError: boolean = false,
  transcriptTitle?: string | null,
  speakers?: string | null,
  transcriptUrl?: string | null,
) {
  //bypass alerts in development
  if (process.env.NODE_ENV === "development") {
    return;
  }

  // Use ternary operator for setting webhookUrl
  const webhookUrl = isError ? process.env.DISCORD_ERROR_WEBHOOK_URL : process.env.DISCORD_TRANSCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Webhook URL is not set");
  }

  const transformedUrl = transformUrl(transcriptUrl);

  // Use template literals for constructing content
  const content = isError ? `❌ Transcript not added to the Queue\n${message}` : `🤖 ${message}\nTitle: ${transcriptTitle}\nSpeakers: ${speakers}\nLink: ${transformedUrl}`;

  try {
    await axios.post(webhookUrl, { content });
  } catch (error) {
    throw new Error("Error sending alert");
  }
}