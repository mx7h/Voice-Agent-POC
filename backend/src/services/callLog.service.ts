import { StatusCodes } from "http-status-codes";

import { callLogRepository } from "../repositories/index.js";
import { ApiError } from "../utils/ApiError.js";

export class CallLogService {
  /**
   * Start a new call
   */
  async startCall(sessionId: string) {
    return callLogRepository.createCallLog({
      sessionId,
      startedAt: new Date(),
    });
  }

  /**
   * Get call log
   */
  async getCallLog(sessionId: string) {
    const callLog =
      await callLogRepository.getCallLogBySession(sessionId);

    if (!callLog) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Call log not found"
      );
    }

    return callLog;
  }

  /**
   * Update transcript
   */
  async updateTranscript(
    callLogId: string,
    transcript: object[]
  ) {
    return callLogRepository.updateTranscript(
      callLogId,
      transcript
    );
  }

  /**
   * Update summary
   */
  async updateSummary(
    callLogId: string,
    summary: string
  ) {
    return callLogRepository.updateSummary(
      callLogId,
      summary
    );
  }

  /**
   * Complete call
   */
  async completeCall(
    callLogId: string,
    duration: number,
    orderId?: string
  ) {
    const completePayload: {
      duration: number;
      endedAt: Date;
      completed: boolean;
      orderId?: string;
    } = {
      duration,
      endedAt: new Date(),
      completed: true,
    };

    if (orderId !== undefined) {
      completePayload.orderId = orderId;
    }

    return callLogRepository.completeCall(callLogId, completePayload);
  }
}