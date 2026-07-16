import type { QueryFilter } from 'mongoose';
import { Menu } from "../models/menu.model.js";

export class MenuRepository {
  /**
   * Get all available menu items
   */
  async getAllMenu() {
    return Menu.find({ available: true }).lean();
  }

  /**
   * Get menu item by Mongo ID
   */
  async getMenuById(id: string) {
    return Menu.findById(id).lean();
  }

  /**
   * Search menu by text
   */
  async searchMenu(query: string) {
    return Menu.find({
      $text: {
        $search: query,
      },
      available: true,
    }).lean();
  }

  /**
   * Get menu by category
   */
  async getMenuByCategory(category: string) {
    return Menu.find({
      category,
      available: true,
    }).lean();
  }

  /**
   * Get all available items
   */
  async getAvailableItems() {
    return Menu.find({
      available: true,
    }).lean();
  }

  /**
   * Get unavailable items
   */
  async getUnavailableItems() {
    return Menu.find({
      available: false,
    }).lean();
  }

  /**
   * Check if menu item exists
   */
  async exists(id: string) {
    return Menu.exists({ _id: id });
  }

  /**
   * Generic filter
   */
  async find(filter: QueryFilter<typeof Menu>) {
    return Menu.find(filter).lean();
  }
}