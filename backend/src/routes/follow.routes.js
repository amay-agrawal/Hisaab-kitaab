import { Router } from "express";
import { toggleFollow, getFollowers, getFollowing } from "../controllers/follow.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT to all follow routes
router.use(verifyJWT);

router.route("/toggle/:targetUserId").post(toggleFollow);
router.route("/followers/:targetUserId").get(getFollowers);
router.route("/following/:targetUserId").get(getFollowing);

export default router;
