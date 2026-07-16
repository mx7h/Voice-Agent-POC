import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { cartService } from "../services/index.js";

export class CartController {
  /**
   * GET /api/v1/cart/:sessionId
   */
  getCart = asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.getCart(req.params.sessionId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  });

  /**
   * POST /api/v1/cart/:sessionId/items
   */
  addToCart = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, quantity, selectedModifiers } = req.body;

    const cart = await cartService.addToCart(
      req.params.sessionId as string,
      menuId,
      quantity,
      selectedModifiers
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  });

  /**
   * DELETE /api/v1/cart/:sessionId/items/:cartItemId
   */
  removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.removeFromCart(
      req.params.sessionId as string,
      req.params.cartItemId as string
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart,
    });
  });

  /**
   * DELETE /api/v1/cart/:sessionId
   */
  clearCart = asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.clearCart(req.params.sessionId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  });
}

export const cartController = new CartController();