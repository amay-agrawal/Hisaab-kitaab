import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to protect the leaderboard endpoint
router.use(verifyJWT);

// Route to get leaderboard
router.route("/").get(getLeaderboard);

export default router;
