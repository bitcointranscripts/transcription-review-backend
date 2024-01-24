import { redis } from "..";
import { DB_QUERY_LIMIT } from "../../utils/constants";
import { Transcript } from "../models";

export const CACHE_EXPIRATION = 60 * 60 * 48; // 48 hours

export async function setCache(key: string, value: string) {
  try {
    await redis.set(key, value, "EX", CACHE_EXPIRATION, "NX");
  } catch (error: any) {
    console.error(`Redis error: set cache -> ${error.message as string}`);
  }
}

export async function deleteCache(key: string) {
  try {
    const cachedData = await redis.get(key);
    if (!cachedData) {
      return;
    }
    return await redis.del(key);
  } catch (error: any) {
    console.error(`Redis error: del cache -> ${error.message as string}`);
  }
}

export async function resetRedisCachedPages() {
  const totalItems = await Transcript.count();
  const totalPages = Math.ceil(totalItems / DB_QUERY_LIMIT);
  for (let page = 1; page <= totalPages; page++) {
    const key = `transcripts:page:${page}`;
    const cachedData = await redis.lrange(key, 0, -1);
    if (!cachedData || cachedData.length === 0) {
      continue;
    }
    await redis.del(key);
  }
}

export async function cacheTranscript(transcriptData: any) {
  const redisTransaction = redis.multi();
  redisTransaction.sadd("cachedTranscripts", transcriptData.id);
  redisTransaction.set(
    `transcript:${transcriptData.id}`,
    JSON.stringify(transcriptData),
    "EX",
    CACHE_EXPIRATION
  );
  const totalItems = await Transcript.count();
  const totalPages = Math.ceil(totalItems / DB_QUERY_LIMIT);
  for (let page = 1; page <= totalPages; page++) {
    redisTransaction.del(`transcripts:page:${page}`);
  }
  await redisTransaction.exec((err, _results) => {
    if (err) {
      Transcript.destroy({ where: { id: transcriptData.id } });
      throw err;
    }
  });
}
