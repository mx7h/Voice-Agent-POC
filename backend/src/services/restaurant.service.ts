import { restaurantRepository } from "../repositories/index.js";
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { emitRestaurantStatus } from "../socket/socket.events.js";

export class RestaurantService {
  async getRestaurant() {
    const restaurant = await restaurantRepository.getRestaurant();

    if (!restaurant) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Restaurant not found"
      );
    }

    return restaurant;
  }

  async getRestaurantById(id: string) {
    const restaurant = await restaurantRepository.getRestaurantById(id);

    if (!restaurant) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Restaurant not found"
      );
    }

    return restaurant;
  }

  async updateRestaurant(id: string, data: object) {
    const restaurant = await restaurantRepository.updateRestaurant(id, data);

    if (!restaurant) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Restaurant not found"
      );
    }

    return restaurant;
  }

  async updateRestaurantStatus(id: string, isOpen: boolean) {
    const restaurant = await restaurantRepository.updateRestaurantStatus(
      id,
      isOpen
    );

    emitRestaurantStatus(isOpen);

    if (!restaurant) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Restaurant not found"
      );
    }

    return restaurant;
  }

  async checkRestaurantOpen() {
    const restaurant = await this.getRestaurant();

    if (!restaurant.isOpen) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Restaurant is currently closed"
      );
    }

    return true;
  }
}