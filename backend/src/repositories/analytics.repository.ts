import { Analytics } from "../models/analytic.model.js";

export class AnalyticsRepository {
  /**
   * Create analytics
   */
  async createAnalytics(analyticsData: object) {
    return Analytics.create(analyticsData);
  }

  /**
   * Get analytics by Mongo ID
   */
  async getAnalyticsById(id: string) {
    return Analytics.findById(id).lean();
  }

  /**
   * Get analytics by session ID
   */
  async getAnalyticsBySession(sessionId: string) {
    return Analytics.findOne({ sessionId }).lean();
  }

  /**
   * Get analytics by order ID
   */
  async getAnalyticsByOrder(orderId: string) {
    return Analytics.findOne({ orderId }).lean();
  }

  /**
   * Update analytics
   */
  async updateAnalytics(id: string, data: object) {
    return Analytics.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Get all analytics
   */
  async getAllAnalytics() {
    return Analytics.find().sort({ createdAt: -1 }).lean();
  }

  /**
   * Delete analytics (testing only)
   */
  async deleteAnalytics(id: string) {
    return Analytics.findByIdAndDelete(id);
  }
}