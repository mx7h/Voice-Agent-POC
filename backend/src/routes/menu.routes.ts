import { Router } from "express";

import { menuController } from "../controllers/menu.controller.js";

const router = Router();

// GET /api/v1/menu
router.get("/", menuController.getAllMenu);

// GET /api/v1/menu/available
router.get("/available", menuController.getAvailableItems);

// GET /api/v1/menu/search?q=pizza
router.get("/search", menuController.searchMenu);

// GET /api/v1/menu/category/:category
router.get("/category/:category", menuController.getMenuByCategory);

// GET /api/v1/menu/:id
router.get("/:id", menuController.getMenuById);

export default router;