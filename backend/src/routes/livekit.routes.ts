import { Router } from "express";
import { liveKitController } from "../controllers/livekit.controller.js";

const router = Router();

router.get(
  "/token/:sessionId",
  liveKitController.createToken
);

export default router;