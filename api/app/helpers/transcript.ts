import crypto from "crypto";
import { BaseParsedMdContent } from "../types/transcript";



const getFirstFiveWords = (paragraph: string) => {
  const words = paragraph.trim().split(/\s+/);
  return words.slice(0, 5).join(" ");
};

const generateUniqueStr = (content: any) => {
  const oc = content;
  const str = oc.title + getFirstFiveWords(oc.body);
  const transcriptHash = str.trim().toLowerCase();

  return transcriptHash;
};

function generateUniqueHash(content: any) {
  const uniqueStr = generateUniqueStr(content);
  const hash = crypto.createHash("sha256");
  hash.update(uniqueStr);
  const buffer = hash.digest();
  return buffer.toString("base64");
}


function parseMdToJSON<T extends BaseParsedMdContent>(mdContent: string): T {
  // This regex is used to match and capture the content between two '---' separators in tstbtc markdown file, typically for front matter, and the rest of the content after the second '---'.
  const regex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/;
  const match = mdContent.match(regex);

  if (!match) {
    throw new Error("Invalid Markdown format");
  }

  const [, header, body] = match;

  const json: Partial<T> = {};
  const lines = header.split("\n");

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      if (key.trim() !== "") {
        if (value.startsWith("'") && value.endsWith("'")) {
          (json as Record<string, string | string[] | undefined>)[key] = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("',")) {
          if (!(json as Record<string, string | string[] | undefined>)[key]) {
            (json as Record<string, string | string[] | undefined>)[key] = [];
          }
          ((json as Record<string, string | string[] | undefined>)[key] as string[]).push(value.slice(1, -2));
        } else {
          (json as Record<string, string | string[] | undefined>)[key] = value;
        }
      }
    }
  }

  json.body = body;

  return json as T;
}


export { generateUniqueStr, generateUniqueHash, parseMdToJSON, };
