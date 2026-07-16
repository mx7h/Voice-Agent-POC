import { Router } from "express";

import { orderController } from "../controllers/order.controller.js";

const router = Router();

// POST /api/v1/orders/:sessionId
router.post("/:sessionId", orderController.placeOrder);

// GET /api/v1/orders
router.get("/", orderController.getOrders);

// GET /api/v1/orders/:id
router.get("/:id", orderController.getOrder);

// PATCH /api/v1/orders/:id/status
router.patch("/:id/status", orderController.updateOrderStatus);

export default router;