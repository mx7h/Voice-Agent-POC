import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { analyticsService } from "../services/index.js";

export class AnalyticsController {
  /**
   * GET /api/v1/analytics
   */
  getAllAnalytics = asyncHandler(
    async (_req: Request, res: Response) => {
      const analytics = await analyticsService.getAllAnalytics();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Analytics fetched successfully",
        data: analytics,
      });
    }
  );

  /**
   * GET /api/v1/analytics/:sessionId
   */
  getAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
      const analytics = await analyticsService.getAnalytics(
        req.params.sessionId as string
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Analytics fetched successfully",
        data: analytics,
      });
    }
  );

  /**
   * PATCH /api/v1/analytics/:sessionId
   */
  updateAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
      const analytics = await analyticsService.updateAnalytics(
        req.params.sessionId as string,
        req.body
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Analytics updated successfully",
        data: analytics,
      });
    }
  );
}

export const analyticsController = new AnalyticsController();