import { io, type Socket } from "socket.io-client";

export const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
    });
  }
  return socket;
}
