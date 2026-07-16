import { CallLog } from "../models/callLog.model.js";

export class CallLogRepository {
  /**
   * Create a call log
   */
  async createCallLog(callLogData: object) {
    return CallLog.create(callLogData);
  }

  /**
   * Get call log by Mongo ID
   */
  async getCallLogById(id: string) {
    return CallLog.findById(id).lean();
  }

  /**
   * Get call log by session ID
   */
  async getCallLogBySession(sessionId: string) {
    return CallLog.findOne({ sessionId }).lean();
  }

  /**
   * Get call log by order ID
   */
  async getCallLogByOrder(orderId: string) {
    return CallLog.findOne({ orderId }).lean();
  }

  /**
   * Update transcript
   */
  async updateTranscript(id: string, transcript: object[]) {
    return CallLog.findByIdAndUpdate(
      id,
      { transcript },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
  }

  /**
   * Update summary
   */
  async updateSummary(id: string, summary: string) {
    return CallLog.findByIdAndUpdate(
      id,
      { summary },
      {
        new: true,
      }
    ).lean();
  }

  /**
   * Complete call
   */
  async completeCall(
    id: string,
    data: {
      duration: number;
      endedAt: Date;
      completed: boolean;
      orderId?: string;
    }
  ) {
    return CallLog.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Delete call log (testing only)
   */
  async deleteCallLog(id: string) {
    return CallLog.findByIdAndDelete(id);
  }
}