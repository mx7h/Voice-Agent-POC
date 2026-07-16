import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { restaurantService } from "../services/index.js";

export class RestaurantController {
  /**
   * GET /api/v1/restaurant
   */
  getRestaurant = asyncHandler(async (_req: Request, res: Response) => {
    const restaurant = await restaurantService.getRestaurant();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Restaurant fetched successfully",
      data: restaurant,
    });
  });

  /**
   * GET /api/v1/restaurant/:id
   */
  getRestaurantById = asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.getRestaurantById(
      req.params.id as string
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Restaurant fetched successfully",
      data: restaurant,
    });
  });

  /**
   * PATCH /api/v1/restaurant/:id
   */
  updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id as string,
      req.body
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  });

  /**
   * PATCH /api/v1/restaurant/:id/status
   */
  updateRestaurantStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { isOpen } = req.body;

      const restaurant =
        await restaurantService.updateRestaurantStatus(
          req.params.id as string,
          isOpen
        );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Restaurant status updated successfully",
        data: restaurant,
      });
    }
  );
}

export const restaurantController = new RestaurantController();