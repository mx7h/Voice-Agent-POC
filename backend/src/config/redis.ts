import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
}

export const redisClient = createClient({
    url: redisUrl,
    socket: {
        connectTimeout: 10000,

        reconnectStrategy: (retries, cause) => {
            const delay = Math.min(retries * 500, 5000);

            console.warn(
                `[REDIS] Reconnecting in ${delay}ms. Attempt: ${retries + 1}`,
                cause?.message ?? "",
            );

            return delay;
        },
    },
});

// Important: register this before connect()
redisClient.on("error", (err) => {
    console.error("[REDIS ERROR]", err.message);
});

redisClient.on("connect", () => {
    console.log("[REDIS] Socket connected");
});

redisClient.on("ready", () => {
    console.log("[REDIS] Ready");
});

redisClient.on("reconnecting", () => {
    console.warn("[REDIS] Reconnecting...");
});

redisClient.on("end", () => {
    console.warn("[REDIS] Connection closed");
});

export const connectRedis = async () => {
    try {
        if (redisClient.isOpen) {
            console.log("[REDIS] Already connected");
            return;
        }

        await redisClient.connect();
        console.log("[REDIS] Connected");
    } catch (err) {
        console.error("[REDIS] Initial connection failed:", err);
        throw err;
        // Do not kill Render service.
        // Render should stay alive, and Redis can reconnect later.
    }
};