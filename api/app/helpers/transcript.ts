import crypto from "crypto";
import  marked, {Tokens}  from "marked";

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

interface JsonToken {
  type: string;
  raw: string;
  text?: string;
  tokens: JsonToken[];
}

function convertTokensToJson(tokens: Tokens.ListItem[]): JsonToken[] {
  const json: JsonToken[] = [];
  for (const token of tokens) {
    const jsonObject: JsonToken = {
      type: token.type,
      raw: token.raw,
      text: token.text,
      tokens: convertTokensToJson(token.tokens as Tokens.ListItem[] || []),
    };
    json.push(jsonObject);
  }
  return json;
}

function convertMdToJSON(md: string): JsonToken[] {
  const tokens = marked.lexer(md);
  return convertTokensToJson(tokens as Tokens.ListItem[]);
}




export { generateUniqueStr, generateUniqueHash, convertMdToJSON };
