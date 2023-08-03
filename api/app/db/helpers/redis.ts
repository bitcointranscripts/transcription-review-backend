import { redis } from "..";

export const CACHE_EXPIRATION = 60 * 60 * 48; // 48 hours

export async function setCache(key: string, value: string) {
  try {
    await redis.set(key, value, "EX", CACHE_EXPIRATION, "NX");
  } catch (error: any) {
    console.error(`Redis error: ${error.message as string}`);
  }
}

export async function deleteCache(key: string) {
  try {
    const cachedData = await redis.get(key);
    if (!cachedData) {
      throw new Error("Cache not found");
    }
    await redis.del(key);
    return;
  } catch (error: any) {
    console.error(`Redis error: ${error.message as string}`);
  }
}
