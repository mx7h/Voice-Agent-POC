import { StatusCodes } from "http-status-codes";
import { analyticsRepository } from "../repositories/index.js";
import { ApiError } from "../utils/ApiError.js";
import { emitAnalyticsUpdated } from "../socket/socket.events.js";

export class AnalyticsService {
  /**
   * Create analytics
   */
  async createAnalytics(data: object) {
    return analyticsRepository.createAnalytics(data);
  }

  /**
   * Get analytics by session
   */
  async getAnalytics(sessionId: string) {
    const analytics =
      await analyticsRepository.getAnalyticsBySession(sessionId);

    if (!analytics) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Analytics not found"
      );
    }

    return analytics;
  }

  /**
   * Update analytics
   */
  async updateAnalytics(
    sessionId: string,
    data: object
  ) {
    const analytics =
      await analyticsRepository.getAnalyticsBySession(sessionId);

    if (!analytics) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Analytics not found"
      );
    }
    const updatedAnalytics =
      await analyticsRepository.updateAnalytics(
        analytics._id.toString(),
        data
      );

    emitAnalyticsUpdated(sessionId, updatedAnalytics);

    return updatedAnalytics;
  }

  /**
   * Get all analytics
   */
  async getAllAnalytics() {
    return analyticsRepository.getAllAnalytics();
  }
}