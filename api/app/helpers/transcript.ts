import crypto from "crypto";

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

export { generateUniqueStr, generateUniqueHash };
