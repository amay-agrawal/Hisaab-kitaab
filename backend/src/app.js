import express from "express";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import leaderboardRouter from "./routes/leaderboard.routes.js";
import followRouter from "./routes/follow.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

// Route Declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/notifications", notificationRouter);

export { app };