import { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * Join a session room
     */
    socket.on("session:join", (sessionId: string) => {
      socket.join(sessionId);

      console.log(
        `Socket ${socket.id} joined session ${sessionId}`
      );

      socket.emit("session:joined", {
        success: true,
        sessionId,
      });
    });

    /**
     * Leave a session room
     */
    socket.on("session:leave", (sessionId: string) => {
      socket.leave(sessionId);

      console.log(
        `Socket ${socket.id} left session ${sessionId}`
      );

      socket.emit("session:left", {
        success: true,
        sessionId,
      });
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", (reason) => {
      console.log(
        `Client disconnected: ${socket.id}, reason: ${reason}`
      );
    });
  });
};