import { AnalyticsService} from "./analytics.service.js";
import { CallLogService } from "./callLog.service.js";
import { CartService } from "./cart.service.js";
import { MenuService } from "./menu.service.js";
import { OrderService } from "./order.service.js";
import { RestaurantService } from "./restaurant.service.js";
import { SessionService } from "./session.service.js";

export const restaurantService = new RestaurantService();
export const menuService = new MenuService();
export const sessionService = new SessionService();
export const callLogService = new CallLogService();
export const analyticsService = new AnalyticsService();
export const orderService = new OrderService();
export const cartService = new CartService();