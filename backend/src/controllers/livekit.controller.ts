import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";

import { liveKitService } from "../services/livekit.service.js";

export class LiveKitController {
  createToken = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const data = await liveKitService.createToken(sessionId as string);

    res.status(200).json({
      success: true,
      data,
    });
  });
}

export const liveKitController = new LiveKitController();