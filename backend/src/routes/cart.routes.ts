import { Router } from "express";

import { cartController } from "../controllers/cart.controller.js";

const router = Router();

// GET /api/v1/cart/:sessionId
router.get("/:sessionId", cartController.getCart);

// POST /api/v1/cart/:sessionId/items
router.post("/:sessionId/items", cartController.addToCart);

// DELETE /api/v1/cart/:sessionId/items/:cartItemId
router.delete(
  "/:sessionId/items/:cartItemId",
  cartController.removeFromCart
);

// DELETE /api/v1/cart/:sessionId
router.delete("/:sessionId", cartController.clearCart);

export default router;