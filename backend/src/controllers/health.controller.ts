import type { Request, Response } from "express";

export const healthCheck = (
  req: Request,
  res: Response
): void => {
  res.status(200).json({
    success: true,
    data: {
      status: "OK",
      message: "Server is running",
    },
  });
};