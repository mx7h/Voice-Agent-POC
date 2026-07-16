import { getIO } from "./index.js";

export const emitCartUpdated = (
  sessionId: string,
  cart: unknown
) => {
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