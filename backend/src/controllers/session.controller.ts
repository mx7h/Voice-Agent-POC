import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { sessionService } from "../services/index.js";

export class SessionController {
  /**
   * POST /api/v1/sessions
   */
  createSession = asyncHandler(async (_req: Request, res: Response) => {
    const session = await sessionService.createSession();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  });

  /**
   * GET /api/v1/sessions/:sessionId
   */
  getSession = asyncHandler(async (req: Request, res: Response) => {
    const session = await sessionService.getSession(
      req.params.sessionId as string
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Session fetched successfully",
      data: session,
    });
  });

  /**
   * DELETE /api/v1/sessions/:sessionId
   */
  deleteSession = asyncHandler(async (req: Request, res: Response) => {
    await sessionService.deleteSession(req.params.sessionId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Session deleted successfully",
    });
  });
}

export const sessionController = new SessionController();