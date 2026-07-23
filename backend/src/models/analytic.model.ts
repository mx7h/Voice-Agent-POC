import { Schema, model } from "mongoose";

const analyticsSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },

    callStartedAt: {
      type: Date,
      default: Date.now,
    },

    callEndedAt: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTurns: {
      type: Number,
      default: 0,
      min: 0,
    },

    userTurns: {
      type: Number,
      default: 0,
      min: 0,
    },

    assistantTurns: {
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

    cachedPromptTokens: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Latest LLM response duration from LiveKit/Groq
     */
    llmDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Latest TTFT from LiveKit/Groq
     */
    llmTtftMs: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Average LLM duration across usage events
     */
    llmAverageDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },

    toolCalls: {
      type: Number,
      default: 0,
      min: 0,
    },

    cartUpdates: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * We map LiveKit ttftMs here
     */
    firstResponseLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Average backend tool latency
     */
    averageLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Total backend tool latency
     */
    totalLatency: {
      type: Number,
      default: 0,
      min: 0,
    },

    orderPlaced: {
      type: Boolean,
      default: false,
    },

    toolEvents: [
      {
        toolName: String,

        latencyMs: {
          type: Number,
          default: 0,
        },

        success: {
          type: Boolean,
          default: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    timelineEvents: [
      {
        type: {
          type: String,
          enum: ["transcript", "tool", "order", "error"],
          required: true,
        },

        role: {
          type: String,
          enum: ["user", "assistant", null],
          default: null,
        },

        text: {
          type: String,
          default: "",
        },

        toolName: {
          type: String,
          default: "",
        },

        toolInput: {
          type: Schema.Types.Mixed,
          default: null,
        },

        toolOutput: {
          type: Schema.Types.Mixed,
          default: null,
        },

        latencyMs: {
          type: Number,
          default: 0,
        },

        success: {
          type: Boolean,
          default: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],


    errors: [
      {
        message: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    lastEventAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

analyticsSchema.index({ createdAt: -1 });

export const Analytics = model("Analytics", analyticsSchema);