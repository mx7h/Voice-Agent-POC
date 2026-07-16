import { RestaurantRepository } from "./restaurant.repository.js";
import { MenuRepository } from "./menu.repository.js";
import { OrderRepository } from "./order.repository.js";
import { CallLogRepository } from "./callLog.repository.js";
import { AnalyticsRepository } from "./analytics.repository.js";

export const restaurantRepository = new RestaurantRepository();
export const menuRepository = new MenuRepository();
export const orderRepository = new OrderRepository();
export const callLogRepository = new CallLogRepository();
export const analyticsRepository = new AnalyticsRepository();