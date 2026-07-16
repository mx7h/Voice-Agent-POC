import { Router } from "express";
import { sessionController } from "../controllers/session.controller.js";

const router = Router();

router.post("/", sessionController.createSession);

router.get("/:sessionId", sessionController.getSession);

router.delete("/:sessionId", sessionController.deleteSession);

export default router;