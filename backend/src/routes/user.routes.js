import { Router } from "express";
import {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    refreshAccessToken,
    updateAccountDetails,
    changeCurrentPassword,
    updateUserSettings,
    updateUserBudgets,
    getPublicProfile,
    deleteUserAccount,
    updateUserAvatar,
    removeUserAvatar,
    sendTestEmailHandler,
    sendWeeklySummaryHandler,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes (verifyJWT middleware)
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/update-profile").patch(verifyJWT, updateAccountDetails);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-settings").patch(verifyJWT, updateUserSettings);
router.route("/update-budgets").patch(verifyJWT, updateUserBudgets);
router.route("/p/:username").get(verifyJWT, getPublicProfile);
router.route("/delete-account").delete(verifyJWT, deleteUserAccount);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/remove-avatar").delete(verifyJWT, removeUserAvatar);
router.route("/send-test-email").post(verifyJWT, sendTestEmailHandler);
router.route("/send-weekly-summary").post(verifyJWT, sendWeeklySummaryHandler);

export default router;