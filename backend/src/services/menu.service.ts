import { StatusCodes } from "http-status-codes";

import { menuRepository } from "../repositories/index.js";

import { ApiError } from "../utils/ApiError.js";

export class MenuService {
  /**
   * Get complete menu
   */
  async getAllMenu() {
    return menuRepository.getAllMenu();
  }

  /**
   * Get menu item by id
   */
  async getMenuById(id: string) {
    const menu = await menuRepository.getMenuById(id);

    if (!menu) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Menu item not found"
      );
    }

    return menu;
  }

  /**
   * Search menu
   */
  async searchMenu(query: string) {
    if (!query.trim()) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Search query is required"
      );
    }

    return menuRepository.searchMenu(query);
  }

  /**
   * Get menu by category
   */
  async getMenuByCategory(category: string) {
    const items = await menuRepository.getMenuByCategory(category);

    if (!items.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "No menu items found"
      );
    }

    return items;
  }

  /**
   * Get all available items
   */
  async getAvailableItems() {
    return menuRepository.getAvailableItems();
  }

  /**
   * Check whether a menu item exists
   */
  async validateMenuItem(id: string) {
    const exists = await menuRepository.exists(id);

    if (!exists) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Menu item not found"
      );
    }

    return true;
  }

  /**
   * Validate required modifier groups
   */
  validateRequiredModifiers(
    menuItem: any,
    selectedModifiers: any[]
  ) {
    const requiredGroups =
      menuItem.modifierGroups.filter(
        (group: any) => group.required
      );

    for (const group of requiredGroups) {
      const found = selectedModifiers.some(
        (modifier) =>
          modifier.groupName === group.name
      );

      if (!found) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `${group.name} is required`
        );
      }
    }

    return true;
  }

  /**
   * Calculate item price
   */
  calculateItemPrice(
    menuItem: any,
    selectedModifiers: any[]
  ) {
    let total = menuItem.basePrice;

    for (const modifier of selectedModifiers) {
      total += modifier.price;
    }

    return total;
  }
}