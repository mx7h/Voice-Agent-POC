import { Router } from "express";

import { analyticsController } from "../controllers/analytics.controller.js";

const router = Router();

// GET /api/v1/analytics
router.get("/", analyticsController.getAllAnalytics);

// GET /api/v1/analytics/:sessionId
router.get("/:sessionId", analyticsController.getAnalytics);

// PATCH /api/v1/analytics/:sessionId
router.patch("/:sessionId", analyticsController.updateAnalytics);

export default router;