import { Router } from "express";

import { callLogController } from "../controllers/callLog.controller.js";

const router = Router();

// GET /api/v1/call-logs/:sessionId
router.get("/:sessionId", callLogController.getCallLog);

// PATCH /api/v1/call-logs/:id/transcript
router.patch(
  "/:id/transcript",
  callLogController.updateTranscript
);

// PATCH /api/v1/call-logs/:id/summary
router.patch(
  "/:id/summary",
  callLogController.updateSummary
);

// PATCH /api/v1/call-logs/:id/complete
router.patch(
  "/:id/complete",
  callLogController.completeCall
);

export default router;