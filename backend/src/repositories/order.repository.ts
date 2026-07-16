import { Order } from "../models/order.model.js";

export class OrderRepository {
  /**
   * Create a new order
   */
  async createOrder(orderData: object) {
    return Order.create(orderData);
  }

  /**
   * Get order by Mongo ID
   */
  async getOrderById(id: string) {
    return Order.findById(id).lean();
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string) {
    return Order.findOne({ orderNumber }).lean();
  }

  /**
   * Get order by session ID
   */
  async getOrderBySession(sessionId: string) {
    return Order.findOne({ sessionId }).lean();
  }

  /**
   * Get all orders
   */
  async getOrders() {
    return Order.find().sort({ createdAt: -1 }).lean();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    orderStatus:
      | "pending"
      | "confirmed"
      | "preparing"
      | "completed"
      | "cancelled"
  ) {
    return Order.findByIdAndUpdate(
      id,
      { orderStatus },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
  }

  /**
   * Update confirmation status
   */
  async updateConfirmationStatus(
    id: string,
    data: {
      confirmationSent?: boolean;
      smsSent?: boolean;
      emailSent?: boolean;
    }
  ) {
    return Order.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
  }

  /**
   * Delete order (mainly for testing)
   */
  async deleteOrder(id: string) {
    return Order.findByIdAndDelete(id);
  }
}