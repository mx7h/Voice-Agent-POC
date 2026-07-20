import { Router } from "express";

import {
  endAnalyticsController,
  getAllAnalyticsController,
  getAnalyticsSummaryController,
  getSessionAnalyticsController,
  recordTurnController,
  startAnalyticsController,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/summary", getAnalyticsSummaryController);
router.get("/sessions", getAllAnalyticsController);
router.get("/:sessionId", getSessionAnalyticsController);

router.post("/:sessionId/start", startAnalyticsController);
router.post("/:sessionId/turn", recordTurnController);
router.post("/:sessionId/end", endAnalyticsController);

export default router;