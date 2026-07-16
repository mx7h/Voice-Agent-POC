import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
}

export const redisClient = createClient({
    url: redisUrl,
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("✅ Redis Connected");
    } catch (err) {
        console.error("❌ Redis Connection Failed");
        process.exit(1);
    }
};