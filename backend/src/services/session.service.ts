import { randomUUID } from "crypto";
import { redisClient } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

const SESSION_TTL = 60 * 30; // 30 minutes

export class SessionService {
  private getKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  async createSession() {
    const sessionId = randomUUID();
    const session = {
      sessionId,

      customer: {
        name: "",
        phone: "",
        email: "",
      },

      cart: {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      },

      transcript: [],

      summary: "",

      currentState: "active",

      analytics: {
        totalTurns: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,

        totalLatency: 0,
        averageLatency: 0,
        toolCalls: 0,
        firstResponseLatency: 0,
        startTime: Date.now(),
      },

      createdAt: Date.now(),
    };

    await redisClient.set(
      this.getKey(sessionId),
      JSON.stringify(session),
      {
        EX: SESSION_TTL,
      }
    );

    return session;
  }

  async getSession(sessionId: string) {
    const session = await redisClient.get(this.getKey(sessionId));

    if (!session) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Session not found"
      );
    }

    return JSON.parse(session);
  }

  async updateSession(sessionId: string, data: any) {
    const session = await this.getSession(sessionId);

    const updatedSession = {
      ...session,
      ...data,
    };

    await redisClient.set(
      this.getKey(sessionId),
      JSON.stringify(updatedSession),
      {
        EX: SESSION_TTL,
      }
    );

    return updatedSession;
  }

  async deleteSession(sessionId: string) {
    await redisClient.del(this.getKey(sessionId));
  }

  async closeSession(sessionId: string) {
    return this.updateSession(sessionId, {
      currentState: "closed",
    });
  }
}