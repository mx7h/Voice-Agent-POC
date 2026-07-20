import { randomUUID } from "crypto";
import { StatusCodes } from "http-status-codes";

import { orderRepository } from "../repositories/index.js";

import {
  analyticsService,
  restaurantService,
  sessionService,
} from "./index.js";

import { ApiError } from "../utils/ApiError.js";

export class OrderService {
  /**
   * Place Order
   */
  async placeOrder(sessionId: string) {
    // Get session
    const session = await sessionService.getSession(sessionId);

    // Restaurant should be open
    await restaurantService.checkRestaurantOpen();

    // Validate cart
    if (!session.cart.items.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cart is empty",
      );
    }

    // Validate customer
    const { name, phone, email } = {
      name: "Mohit",
      phone: "1234567890",
      email: "mohit@example.com",
    };

    if (!name || !phone || !email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Customer details are incomplete",
      );
    }

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Save order
    const order = await orderRepository.createOrder({
      sessionId,

      orderNumber,

      customerName: name,

      customerPhone: phone,

      customerEmail: email,

      items: session.cart.items,

      subtotal: session.cart.subtotal,

      tax: session.cart.tax,

      total: session.cart.total,

      orderStatus: "confirmed",
    });

    await this.recordOrderPlacedAnalytics(
      sessionId,
      order._id.toString(),
    );

    // TODO
    // await emailService.sendOrderConfirmation(order);
    // await smsService.sendConfirmation(order);
    // await callLogService.completeCall(...)

    // Clear cart
    const emptyCart = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    await sessionService.updateSession(sessionId, {
      cart: emptyCart,
      currentState: "order_placed",
    });

    console.log("[ORDER PLACED]", {
      sessionId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    console.log("[ORDER CART CLEARED]", {
      sessionId,
      cart: emptyCart,
    });

    // Socket disabled because frontend uses polling
    // emitCartUpdated(sessionId, emptyCart);
    // emitOrderPlaced(sessionId, order);

    return order;
  }

  /**
   * Get order
   */
  async getOrder(orderId: string) {
    const order = await orderRepository.getOrderById(orderId);

    if (!order) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Order not found",
      );
    }

    return order;
  }

  /**
   * Get all orders
   */
  async getOrders() {
    return orderRepository.getOrders();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "completed"
      | "cancelled",
  ) {
    const order = await orderRepository.updateOrderStatus(
      orderId,
      status,
    );

    if (!order) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Order not found",
      );
    }

    return order;
  }

  /**
   * Record order analytics without breaking order flow
   */
  private async recordOrderPlacedAnalytics(
    sessionId: string,
    orderId: string,
  ) {
    try {
      await analyticsService.recordOrderPlaced(
        sessionId,
        orderId,
      );

      console.log("[ANALYTICS ORDER PLACED]", {
        sessionId,
        orderId,
      });
    } catch (error) {
      console.warn("[ANALYTICS ORDER ERROR]", {
        sessionId,
        orderId,
        error,
      });
    }
  }

  /**
   * Generate order number
   */
  private generateOrderNumber() {
    return `ORD-${Date.now()}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;
  }
}