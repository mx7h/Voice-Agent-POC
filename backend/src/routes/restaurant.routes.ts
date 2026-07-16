import { Router } from "express";

import { restaurantController } from "../controllers/restaurant.controller.js";

const router = Router();

// GET /api/v1/restaurant
router.get("/", restaurantController.getRestaurant);

// GET /api/v1/restaurant/:id
router.get("/:id", restaurantController.getRestaurantById);

// PATCH /api/v1/restaurant/:id
router.patch("/:id", restaurantController.updateRestaurant);

// PATCH /api/v1/restaurant/:id/status
router.patch("/:id/status", restaurantController.updateRestaurantStatus);

export default router;