import { Router } from "express";
import { getAnalyticsStats } from "../controllers/analytics.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to protect the analytics routes
router.use(verifyJWT);

// Route to get analytics stats
router.route("/stats").get(getAnalyticsStats);

export default router;
