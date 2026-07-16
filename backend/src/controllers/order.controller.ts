import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { orderService } from "../services/index.js";

export class OrderController {
  /**
   * POST /api/v1/orders/:sessionId
   */
  placeOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.placeOrder(req.params.sessionId as string);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  });

  /**
   * GET /api/v1/orders
   */
  getOrders = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await orderService.getOrders();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  });

  /**
   * GET /api/v1/orders/:id
   */
  getOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrder(req.params.id as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  });

  /**
   * PATCH /api/v1/orders/:id/status
   */
  updateOrderStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { orderStatus } = req.body;

      const order = await orderService.updateOrderStatus(
        req.params.id as string,
        orderStatus
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      });
    }
  );
}

export const orderController = new OrderController();