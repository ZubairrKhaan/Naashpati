import { getRedisClient } from "../config/redis.js";

const CACHE_KEY_PREFIX = "bestsellers:v1";
const DEFAULT_TTL_SECONDS = 60 * 5;

const normalizeValue = (value) => {
  if (!value) return "all";
  return String(value).trim().toLowerCase();
};

export const buildBestsellerCacheKey = ({ page, limit, category } = {}) => {
  return [
    CACHE_KEY_PREFIX,
    `page:${normalizeValue(page || 1)}`,
    `limit:${normalizeValue(limit || 8)}`,
    `category:${normalizeValue(category || "all")}`,
  ].join(":");
};

export const getBestsellerCache = async (params) => {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  const key = buildBestsellerCacheKey(params);
  const payload = await client.get(key);
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const setBestsellerCache = async (params, value) => {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  const key = buildBestsellerCacheKey(params);
  await client.set(key, JSON.stringify(value), {
    EX: Number(process.env.BESTSELLER_CACHE_TTL_SECONDS) || DEFAULT_TTL_SECONDS,
  });
};

export const invalidateBestsellerCache = async () => {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  let cursor = "0";
  do {
    const result = await client.scan(cursor, {
      MATCH: `${CACHE_KEY_PREFIX}:*`,
      COUNT: 100,
    });

    cursor = result.cursor;
    if (result.keys?.length) {
      await client.del(result.keys);
    }
  } while (cursor !== "0");
};
