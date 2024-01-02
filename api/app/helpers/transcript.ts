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
  const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = mdContent.match(regex);

  if (!match) {
    throw new Error("Invalid Markdown format");
  }

  const [, header, body] = match;

import yaml from "js-yaml"
....
const json: Record<string, string | string[] | undefined> = yaml.load(header) as Partial<T>

  json.body = body;

  return json as T;
}


export { generateUniqueStr, generateUniqueHash, parseMdToJSON, };
