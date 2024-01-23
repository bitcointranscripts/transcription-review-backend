export const objectKeys = <T extends object, K extends keyof T>(
  object: T
): K[] => Object.keys(object) as K[];

export const objectValues = <T extends object, V extends T[keyof T]>(
  object: T
): V[] => Object.values(object) as V[];

const wordPattern =
  /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;
export function wordCount(data: string) {
  const match = data.match(wordPattern);
  let count = 0;
  if (!match) {
    return 0;
  }
  for (let i = 0; i < match.length; i++) {
    if (match[i].charCodeAt(0) >= 0x4e00) {
      count += match[i].length;
    } else {
      count += 1;
    }
  }
  return count;
}

const validateTranscriptTitle = (title: string) => {
  // check if title includes, hyphen, paranthesis, slashes and brackets
  const regex = /[-()\\\/\[\]]/;
  if (regex.test(title)) {
    return false;
  }
  return true;
};

interface Content {
  title: string;
  tags: string[];
  speakers: string[];
  categories: string[];
  loc: string;
}

export const validateTranscriptMetadata = (
  content: Partial<Content>
): { isValid: boolean; keys: string | null } => {
  const keys = ["title", "tags", "speakers", "categories", "loc"];
  const missingKeys = keys.filter((key) => !(key in content));

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      keys: missingKeys.join(", "),
    };
  }

  const invalidKey: (keyof Content)[] = [];

  if (!validateTranscriptTitle(content.title as string)) {
    invalidKey.push("title");
  }

  if (typeof content.loc !== "string") {
    invalidKey.push("loc");
  }

  (["tags", "speakers", "categories"] as Array<keyof Content>).forEach(
    (key) => {
      const value = content[key];
      if (value !== undefined) {
        if (!Array.isArray(value)) {
          invalidKey.push(key);
        }
        if (
          Array.isArray(value) &&
          value.some((item) => typeof item !== "string")
        ) {
          invalidKey.push(key);
        }
      }
    }
  );

  if (invalidKey.length > 0) {
    return {
      isValid: false,
      keys: invalidKey.join(", "),
    };
  }

  return { isValid: true, keys: null };
};



export const isTranscriptValid = (transcript_by: string): boolean => {
  const lowerCaseTranscriptBy = transcript_by.toLowerCase();
  return (
    lowerCaseTranscriptBy.includes("tstbtc") &&
    lowerCaseTranscriptBy.includes("--needs-review")
  );
}