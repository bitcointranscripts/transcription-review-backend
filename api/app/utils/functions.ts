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
