import { createClient } from "redis";

let clientPromise = null;

const getRedisUrl = () => process.env.REDIS_URL || process.env.REDIS_URI || "";

export const getRedisClient = async () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    return null;
  }

  if (!clientPromise) {
    const client = createClient({ url: redisUrl });
    client.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });

    clientPromise = client
      .connect()
      .then(() => client)
      .catch((err) => {
        clientPromise = null;
        console.error("[Redis] Failed to connect:", err.message);
        return null;
      });
  }

  return clientPromise;
};
