import { getIO } from "./index.js";

export const emitCartUpdated = (
  sessionId: string,
  cart: unknown
) => {
  const roomSize = getIO().sockets.adapter.rooms.get(sessionId)?.size ?? 0;
  console.log("[SOCKET EMIT] cart:updated", {
    sessionId,
    roomSize,
  });
  getIO().to(sessionId).emit("cart:updated", cart);
};

export const emitTranscriptUpdated = (
  sessionId: string,
  transcript: unknown
) => {
  getIO().to(sessionId).emit(
    "transcript:updated",
    transcript
  );
};

export const emitOrderPlaced = (
  sessionId: string,
  order: unknown
) => {
  getIO().to(sessionId).emit("order:placed", order);
};

export const emitAnalyticsUpdated = (
  sessionId: string,
  analytics: unknown
) => {
  getIO().to(sessionId).emit(
    "analytics:updated",
    analytics
  );
};

export const emitRestaurantStatus = (
  isOpen: boolean
) => {
  getIO().emit("restaurant:status", {
    isOpen,
  });
};