import { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { registerSocketHandlers } from "./socket.handler.js";

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  registerSocketHandlers(io);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};