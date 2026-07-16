import { Schema, model } from "mongoose";

const analyticsSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    totalTurns: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTokens: {
      type: Number,
      default: 0,
      min: 0,
    },

    promptTokens: {
      type: Number,
      default: 0,
      min: 0,
    },

    completionTokens: {
      type: Number,
      default: 0,
      min: 0,
    },

    toolCalls: {
      type: Number,
      default: 0,
      min: 0,
    },

    firstResponseLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDuration: {
      type: Number,
      default: 0,
      min: 0,
    },

    orderPlaced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ sessionId: 1 });

analyticsSchema.index({ orderId: 1 });

analyticsSchema.index({ createdAt: -1 });

export const Analytics = model("Analytics", analyticsSchema);