import { Schema, model } from "mongoose";

const transcriptSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const toolCallSchema = new Schema(
  {
    toolName: {
      type: String,
      required: true,
      trim: true,
    },

    arguments: {
      type: Schema.Types.Mixed,
      default: {},
    },

    result: {
      type: Schema.Types.Mixed,
      default: {},
    },

    executionTime: {
      type: Number,
      default: 0,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const callLogSchema = new Schema(
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
    },

    transcript: {
      type: [transcriptSchema],
      default: [],
    },

    summary: {
      type: String,
      default: "",
    },

    toolCalls: {
      type: [toolCallSchema],
      default: [],
    },

    duration: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    endedAt: {
      type: Date,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

callLogSchema.index({ sessionId: 1 });

callLogSchema.index({ orderId: 1 });

callLogSchema.index({ createdAt: -1 });

export const CallLog = model("CallLog", callLogSchema);