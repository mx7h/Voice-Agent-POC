import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/mongodb.js";
import { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./socket/index.js";
import http from "http";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    const server = http.createServer(app);

    initializeSocket(server);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error(error);
  }
};

startServer();