import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";

import { menuService } from "../services/index.js";

export class MenuController {
  /**
   * GET /api/v1/menu
   */
  getAllMenu = asyncHandler(async (_req: Request, res: Response) => {
    const menu = await menuService.getAllMenu();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Menu fetched successfully",
      data: menu,
    });
  });

  /**
   * GET /api/v1/menu/:id
   */
  getMenuById = asyncHandler(async (req: Request, res: Response) => {
    const menuItem = await menuService.getMenuById(req.params.id as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Menu item fetched successfully",
      data: menuItem,
    });
  });

  /**
   * GET /api/v1/menu/search?q=pizza
   */
  searchMenu = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;

    const menu = await menuService.searchMenu(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Search completed successfully",
      data: menu,
    });
  });

  /**
   * GET /api/v1/menu/category/:category
   */
  getMenuByCategory = asyncHandler(
    async (req: Request, res: Response) => {
      const menu = await menuService.getMenuByCategory(
        req.params.category as string
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Category fetched successfully",
        data: menu,
      });
    }
  );

  /**
   * GET /api/v1/menu/available
   */
  getAvailableItems = asyncHandler(
    async (_req: Request, res: Response) => {
      const items = await menuService.getAvailableItems();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Available menu fetched successfully",
        data: items,
      });
    }
  );
}

export const menuController = new MenuController();