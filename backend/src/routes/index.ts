import { Router } from "express";

import restaurantRoutes from "./restaurant.routes.js";
import menuRoutes from "./menu.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";
import callLogRoutes from "./callLog.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import sessionRoutes from "./session.routes.js";
import livekitRoutes from "./livekit.routes.js";

const router = Router();

router.use("/restaurant", restaurantRoutes);
router.use("/menu", menuRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/call-logs", callLogRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/sessions", sessionRoutes);
router.use("/livekit", livekitRoutes);


export default router;