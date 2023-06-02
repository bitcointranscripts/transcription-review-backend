export const objectKeys = <T extends object, K extends keyof T>(
  object: T
): K[] => Object.keys(object) as K[];

export const objectValues = <T extends object, V extends T[keyof T]>(
  object: T
): V[] => Object.values(object) as V[];
