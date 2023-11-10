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

export const validateTranscriptMetadata = (content: Record<string, any>) => {
  const keys = ["title", "tags", "speakers", "categories", "loc"];
  const contentKeys = Object.keys(content);
  const isValid = keys.every((key) => contentKeys.includes(key));

  if (!isValid) {
    return false;
  }

  if (!validateTranscriptTitle(content.title)) {
    return false;
  }

  if (typeof content.loc !== "string") {
    return false;
  }

  if (
    !Array.isArray(content.tags) ||
    !Array.isArray(content.speakers) ||
    !Array.isArray(content.categories)
  ) {
    return false;
  } else if (
    (content.tags.length > 0 &&
      content.tags.some((tag) => typeof tag !== "string")) ||
    (content.speakers.length > 0 &&
      content.speakers.some((speaker) => typeof speaker !== "string")) ||
    (content.categories.length > 0 &&
      content.categories.some((category) => typeof category !== "string"))
  ) {
    return false;
  }

  return true;
};
