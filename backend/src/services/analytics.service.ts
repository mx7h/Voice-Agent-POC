import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import { Analytics } from "../models/analytic.model.js";
import { ApiError } from "../utils/ApiError.js";

type TurnRole = "user" | "assistant";
type AnalyticsStatus = "active" | "completed" | "failed";

export class AnalyticsService {
  async startSession(sessionId: string) {
    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          callStartedAt: new Date(),
          status: "active",
        },
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async recordTurn(sessionId: string, role: TurnRole) {
    const inc: Record<string, number> = {
      totalTurns: 1,
    };

    if (role === "user") {
      inc.userTurns = 1;
    }

    if (role === "assistant") {
      inc.assistantTurns = 1;
    }

    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $inc: inc,
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }
  async recordTranscript(
    sessionId: string,
    role: TurnRole,
    text: string,
  ) {
    const cleanText = String(text ?? "").trim();

    if (!cleanText) {
      return Analytics.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            lastEventAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );
    }

    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          timelineEvents: {
            type: "transcript",
            role,
            text: cleanText,
            createdAt: new Date(),
          },
        },
        $inc: {
          totalTurns: 1,
          ...(role === "user" ? { userTurns: 1 } : {}),
          ...(role === "assistant" ? { assistantTurns: 1 } : {}),
        },
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  /**
   * Backend tool latency analytics.
   */
  async recordToolCall(
    sessionId: string,
    toolName: string,
    latencyMs = 0,
    success = true,
  ) {
    const analytics = await Analytics.findOneAndUpdate(
      { sessionId },
      {
        $inc: {
          toolCalls: 1,
          totalLatency: latencyMs,
        },
        $push: {
          toolEvents: {
            toolName,
            latencyMs,
            success,
            createdAt: new Date(),
          },

          timelineEvents: {
            type: "tool",
            toolName,
            latencyMs,
            success,
            createdAt: new Date(),
          },
        },
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    await this.recalculateAverageLatency(sessionId);

    return analytics;
  }

  async recordCartUpdate(sessionId: string) {
    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $inc: {
          cartUpdates: 1,
        },
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async recordOrderPlaced(sessionId: string, orderId: string) {
    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          orderPlaced: true,
          orderId: new Types.ObjectId(orderId),
          status: "completed",
          lastEventAt: new Date(),
        },
        $push: {
          timelineEvents: {
            type: "order",
            text: "Order placed successfully.",
            toolName: "placeOrder",
            toolOutput: {
              orderId,
            },
            success: true,
            createdAt: new Date(),
          },
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  /**
   * Real LiveKit/Groq token analytics.
   *
   * LiveKit usage is cumulative, so we use $set instead of $inc.
   * We removed llmUsageEvents array and keep only latest totals.
   */
  async recordTokenUsage(
    sessionId: string,
    data: {
      totalTokens?: number;
      promptTokens?: number;
      completionTokens?: number;
      cachedPromptTokens?: number;
      durationMs?: number;
      ttftMs?: number;
      provider?: string;
      model?: string;
    },
  ) {
    const promptTokens = Number(data.promptTokens ?? 0);
    const completionTokens = Number(data.completionTokens ?? 0);

    const totalTokens = Number(
      data.totalTokens ?? promptTokens + completionTokens,
    );

    const cachedPromptTokens = Number(data.cachedPromptTokens ?? 0);
    const durationMs = Number(data.durationMs ?? 0);
    const ttftMs = Number(data.ttftMs ?? 0);

    if (totalTokens <= 0) {
      return Analytics.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            lastEventAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );
    }

    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          promptTokens,
          completionTokens,
          totalTokens,
          cachedPromptTokens,

          llmDurationMs: durationMs,
          llmTtftMs: ttftMs,

          ...(ttftMs > 0
            ? {
              firstResponseLatency: ttftMs,
            }
            : {}),

          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async recordFirstResponseLatency(
    sessionId: string,
    latencyMs: number,
  ) {
    const analytics = await Analytics.findOne({ sessionId });

    if (analytics?.firstResponseLatency) {
      return analytics;
    }

    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          firstResponseLatency: latencyMs,
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async recordError(sessionId: string, message: string) {
    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          errors: {
            message,
            createdAt: new Date(),
          },

          timelineEvents: {
            type: "error",
            text: message,
            success: false,
            createdAt: new Date(),
          },
        },
        $set: {
          status: "failed",
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async endSession(
    sessionId: string,
    status: AnalyticsStatus = "completed",
  ) {
    const analytics = await Analytics.findOne({ sessionId });

    const endedAt = new Date();

    const durationSeconds = analytics?.callStartedAt
      ? Math.round(
        (endedAt.getTime() -
          analytics.callStartedAt.getTime()) /
        1000,
      )
      : 0;

    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          callEndedAt: endedAt,
          durationSeconds,
          status,
          lastEventAt: endedAt,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  async getAnalytics(sessionId: string) {
    const analytics = await Analytics.findOne({ sessionId }).populate(
      "orderId",
    );

    if (!analytics) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Analytics not found",
      );
    }

    return analytics;
  }

  async getAllAnalytics() {
    return Analytics.find()
      .sort({ createdAt: -1 })
      .populate("orderId");
  }

  async getSummary() {
    const [summary] = await Analytics.aggregate([
      {
        $group: {
          _id: null,

          totalCalls: {
            $sum: 1,
          },

          activeCalls: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },

          completedCalls: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },

          failedCalls: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },

          ordersPlaced: {
            $sum: {
              $cond: ["$orderPlaced", 1, 0],
            },
          },

          totalTurns: {
            $sum: "$totalTurns",
          },

          totalToolCalls: {
            $sum: "$toolCalls",
          },

          totalCartUpdates: {
            $sum: "$cartUpdates",
          },

          totalPromptTokens: {
            $sum: "$promptTokens",
          },

          totalCompletionTokens: {
            $sum: "$completionTokens",
          },

          totalTokens: {
            $sum: "$totalTokens",
          },

          totalCachedPromptTokens: {
            $sum: "$cachedPromptTokens",
          },

          averageTurns: {
            $avg: "$totalTurns",
          },

          averageDurationSeconds: {
            $avg: "$durationSeconds",
          },

          averageLatency: {
            $avg: "$averageLatency",
          },

          averageFirstResponseLatency: {
            $avg: "$firstResponseLatency",
          },

          averageLlmDurationMs: {
            $avg: "$llmDurationMs",
          },

          averageLlmTtftMs: {
            $avg: "$llmTtftMs",
          },
        },
      },
    ]);

    return (
      summary ?? {
        totalCalls: 0,
        activeCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        ordersPlaced: 0,

        totalTurns: 0,
        totalToolCalls: 0,
        totalCartUpdates: 0,

        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCachedPromptTokens: 0,

        averageTurns: 0,
        averageDurationSeconds: 0,

        averageLatency: 0,
        averageFirstResponseLatency: 0,

        averageLlmDurationMs: 0,
        averageLlmTtftMs: 0,
      }
    );
  }
  async recordTimelineEvent(
    sessionId: string,
    event: {
      type: "transcript" | "tool" | "order" | "error";
      role?: "user" | "assistant" | null;
      text?: string;
      toolName?: string;
      toolInput?: unknown;
      toolOutput?: unknown;
      latencyMs?: number;
      success?: boolean;
    },
  ) {
    return Analytics.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          timelineEvents: {
            ...event,
            createdAt: new Date(),
          },
        },
        $set: {
          lastEventAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }
  /**
   * Average backend tool latency.
   */
  private async recalculateAverageLatency(sessionId: string) {
    const analytics = await Analytics.findOne({ sessionId });

    if (!analytics) {
      return;
    }

    const toolEvents = analytics.toolEvents ?? [];

    const validLatencies = toolEvents
      .map((event: any) => Number(event.latencyMs ?? 0))
      .filter((latency) => latency > 0);

    if (validLatencies.length === 0) {
      return;
    }

    const averageLatency = Math.round(
      validLatencies.reduce(
        (sum, latency) => sum + latency,
        0,
      ) / validLatencies.length,
    );

    await Analytics.updateOne(
      { sessionId },
      {
        $set: {
          averageLatency,
        },
      },
    );
  }
}

export const analyticsService = new AnalyticsService();