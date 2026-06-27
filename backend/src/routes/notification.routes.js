import { Router } from "express";
import { getNotifications, markRead, markAllRead, deleteNotification } from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all notification routes
router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/mark-read/:notifId").patch(markRead);
router.route("/mark-all-read").patch(markAllRead);
router.route("/delete/:notifId").delete(deleteNotification);

export default router;
