import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { analyticsService } from "../services/index.js";

export const startAnalyticsController = async (
  req: Request,
  res: Response,
) => {
  const { sessionId } = req.params;

  const analytics = await analyticsService.startSession(sessionId as string);

  res.status(StatusCodes.OK).json({
    success: true,
    data: analytics,
  });
};

export const recordTurnController = async (
  req: Request,
  res: Response,
) => {
  const { sessionId } = req.params;
  const { role } = req.body;

  if (role !== "user" && role !== "assistant") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "role must be user or assistant",
    });
  }

  const analytics = await analyticsService.recordTurn(sessionId as string, role);

  res.status(StatusCodes.OK).json({
    success: true,
    data: analytics,
  });
};

export const endAnalyticsController = async (
  req: Request,
  res: Response,
) => {
  const { sessionId } = req.params;
  const { status } = req.body;

  const analytics = await analyticsService.endSession(
    sessionId as string,
    status === "failed" ? "failed" : "completed",
  );

  res.status(StatusCodes.OK).json({
    success: true,
    data: analytics,
  });
};

export const getAnalyticsSummaryController = async (
  _req: Request,
  res: Response,
) => {
  const summary = await analyticsService.getSummary();

  res.status(StatusCodes.OK).json({
    success: true,
    data: summary,
  });
};

export const getAllAnalyticsController = async (
  _req: Request,
  res: Response,
) => {
  const analytics = await analyticsService.getAllAnalytics();

  res.status(StatusCodes.OK).json({
    success: true,
    data: analytics,
  });
};

export const getSessionAnalyticsController = async (
  req: Request,
  res: Response,
) => {
  const { sessionId } = req.params;

  const analytics = await analyticsService.getAnalytics(sessionId as string);

  res.status(StatusCodes.OK).json({
    success: true,
    data: analytics,
  });
};