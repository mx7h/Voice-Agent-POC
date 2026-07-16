import { Restaurant } from "../models/restaurant.model.js";

export class RestaurantRepository {
  async getRestaurant() {
    return Restaurant.findOne().lean();
  }

  async getRestaurantById(id: string) {
    return Restaurant.findById(id).lean();
  }

  async updateRestaurant(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
      email: string;
      openingHours: string;
      timezone: string;
      isOpen: boolean;
    }>
  ) {
    return Restaurant.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async updateRestaurantStatus(id: string, isOpen: boolean) {
    return Restaurant.findByIdAndUpdate(
      id,
      { isOpen },
      {
        new: true,
      }
    ).lean();
  }
}