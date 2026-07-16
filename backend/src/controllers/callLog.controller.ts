import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { callLogService } from "../services/index.js";

export class CallLogController {
  /**
   * GET /api/v1/call-logs/:sessionId
   */
  getCallLog = asyncHandler(async (req: Request, res: Response) => {
    const callLog = await callLogService.getCallLog(
      req.params.sessionId as string
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Call log fetched successfully",
      data: callLog,
    });
  });

  /**
   * PATCH /api/v1/call-logs/:id/transcript
   */
  updateTranscript = asyncHandler(
    async (req: Request, res: Response) => {
      const { transcript } = req.body;

      const callLog = await callLogService.updateTranscript(
        req.params.id as string,
        transcript
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Transcript updated successfully",
        data: callLog,
      });
    }
  );

  /**
   * PATCH /api/v1/call-logs/:id/summary
   */
  updateSummary = asyncHandler(
    async (req: Request, res: Response) => {
      const { summary } = req.body;

      const callLog = await callLogService.updateSummary(
        req.params.id as string,
        summary
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Summary updated successfully",
        data: callLog,
      });
    }
  );

  /**
   * PATCH /api/v1/call-logs/:id/complete
   */
  completeCall = asyncHandler(
    async (req: Request, res: Response) => {
      const { duration, orderId } = req.body;

      const callLog = await callLogService.completeCall(
        req.params.id as string,
        duration,
        orderId
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Call completed successfully",
        data: callLog,
      });
    }
  );
}

export const callLogController = new CallLogController();