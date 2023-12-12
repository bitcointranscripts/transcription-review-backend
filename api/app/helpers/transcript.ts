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

function parseMdToJSON(mdContent: any) {
  const regex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/;
  const match = mdContent.match(regex);

  if (!match) {
    throw new Error("Invalid Markdown format");
  }

  const header = match[1];
  const body = match[2].replace(/\n/g, " ");

  const json: any = {};
  const lines = header.split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      if (key.trim() !== "") {
        if (value.startsWith("'") && value.endsWith("'")) {
          json[key] = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("',")) {
          if (!json[key]) {
            json[key] = [];
          }
          json[key].push(value.slice(1, -2));
        } else {
          json[key] = value;
        }
      }
    }
  }

  json.body = body;

  return json;
}

export { generateUniqueStr, generateUniqueHash, parseMdToJSON };
