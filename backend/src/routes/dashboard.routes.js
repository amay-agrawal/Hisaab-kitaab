import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to protect the dashboard endpoint
router.use(verifyJWT);

// Route to get dashboard statistics
router.route("/stats").get(getDashboardStats);

export default router;
