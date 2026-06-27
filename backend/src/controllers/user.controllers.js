import { User } from "../models/user.models.js";
import { Follow } from "../models/follow.models.js";
import { Transaction } from "../models/transaction.models.js";
import { Notification } from "../models/notification.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendTestEmail, sendWeeklySummaryEmail } from "../utils/email.service.js";

const generateAccessAndRefreshTokens = async (userId) => {

    try {

        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {

        throw new Error("Something went wrong while generating tokens");

    }

};

const registerUser = async (req, res) => {
    const {
        fullName,
        email,
        username,
        password
    } = req.body;

    if (
        !fullName ||
        !email ||
        !username ||
        !password
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const existedUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    });

    if (existedUser) {
        return res.status(409).json({
            message: "User already exists"
        });
    }
    const hashedPassword = await bcrypt.hash(
    password,
    10
    );

    const user = await User.create({
        fullName,
        email,
        username,
        password:hashedPassword
    });

    return res.status(201).json({
        message: "User Registered Successfully",
        user
    });
};


const loginUser = async (req, res) => {

    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and Password are required"
        });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: "User does not exist , Please register first "
        });
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        return res.status(401).json({
            message: "Invalid Password"
        });
    }
    // Generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // Get updated user without password & refresh token
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        message: "Login Successful",
        user: loggedInUser,
        accessToken,
        refreshToken
    });

};

const getCurrentUser = async (req, res) => {

    return res.status(200).json({
        user: req.user
    });

};

const logoutUser = async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({
            message: "User Logged Out Successfully"
        });

};
const refreshAccessToken = async (req, res) => {

    try {

        const incomingRefreshToken =
            req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                message: "Unauthorized Request"
            });
        }

        // Verify refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find user
        const user = await User.findById(decodedToken._id);

        if (!user) {
            return res.status(401).json({
                message: "Invalid Refresh Token"
            });
        }

        // Compare refresh token stored in DB
        if (incomingRefreshToken !== user.refreshToken) {
            return res.status(401).json({
                message: "Refresh Token Expired or Used"
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                message: "Access Token Refreshed Successfully",
                accessToken,
                refreshToken
            });

    } catch (error) {

        return res.status(401).json({
            message: "Invalid Refresh Token"
        });

    }

};

const updateAccountDetails = async (req, res) => {
    const { fullName, email, username } = req.body;

    if (!fullName || !email || !username) {
        return res.status(400).json({
            message: "Full name, email, and username are required."
        });
    }

    try {
        const existedUser = await User.findOne({
            _id: { $ne: req.user._id },
            $or: [
                { email },
                { username }
            ]
        });

        if (existedUser) {
            return res.status(409).json({
                message: "Username or Email is already taken by another user."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                    email,
                    username
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            message: "Account details updated successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while updating details",
            error: error.message
        });
    }
};

const changeCurrentPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Current password and new password are required."
        });
    }

    try {
        const user = await User.findById(req.user._id);

        const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect current password."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while changing password",
            error: error.message
        });
    }
};

const updateUserSettings = async (req, res) => {
    const { settings } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { settings } },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            message: "User settings updated successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while saving settings",
            error: error.message
        });
    }
};

const updateUserBudgets = async (req, res) => {
    const { budgets } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.budgets = budgets;
        await user.save();

        // Convert user to object and delete sensitive properties
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshToken;

        return res.status(200).json({
            message: "User budgets updated successfully",
            user: userObj
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while saving budgets",
            error: error.message
        });
    }
};

const getPublicProfile = async (req, res) => {
    const { username } = req.params;
    const currentUserId = req.user._id;

    try {
        const targetUser = await User.findOne({ username }).select("-password -refreshToken");
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate their Financial Score / Points
        const userStats = await Transaction.aggregate([
            { $match: { owner: targetUser._id } },
            {
                $group: {
                    _id: null,
                    income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
                }
            },
            {
                $project: {
                    savingsRate: {
                        $cond: {
                            if: { $eq: ["$income", 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    { $divide: [{ $subtract: ["$income", "$expense"] }, "$income"] },
                                    100
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        const savingsRate = userStats[0]?.savingsRate || 0;
        const points = Math.max(0, Math.round(savingsRate * 10));

        // Get followers / following count
        const followersCount = await Follow.countDocuments({ following: targetUser._id });
        const followingCount = await Follow.countDocuments({ follower: targetUser._id });

        // Check if current user is following them
        const isFollowingRecord = await Follow.findOne({
            follower: currentUserId,
            following: targetUser._id
        });
        const isFollowing = !!isFollowingRecord;

        // Calculate spending category percentages
        const totalExpenses = await Transaction.aggregate([
            { $match: { owner: targetUser._id, type: "expense" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalAmount = totalExpenses[0]?.total || 0;

        let categoryPercentages = [];
        if (totalAmount > 0) {
            const categorySpends = await Transaction.aggregate([
                { $match: { owner: targetUser._id, type: "expense" } },
                { $group: { _id: "$category", amount: { $sum: "$amount" } } }
            ]);
            categoryPercentages = categorySpends.map(c => ({
                category: c._id,
                percentage: Math.round((c.amount / totalAmount) * 100)
            })).sort((a, b) => b.percentage - a.percentage);
        }

        return res.status(200).json({
            message: "Public profile fetched successfully",
            profile: {
                _id: targetUser._id,
                fullName: targetUser.fullName,
                username: targetUser.username,
                avatar: targetUser.avatar,
                points,
                followersCount,
                followingCount,
                isFollowing,
                categoryPercentages
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while fetching public profile",
            error: error.message
        });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all transactions of the user
        await Transaction.deleteMany({ owner: userId });

        // Delete all follow connections of the user
        await Follow.deleteMany({
            $or: [{ follower: userId }, { following: userId }]
        });

        // Delete all notification documents of the user
        await Notification.deleteMany({ recipient: userId });

        // Delete user account
        await User.findByIdAndDelete(userId);

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({
                message: "User account and all related history deleted successfully"
            });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while deleting user account",
            error: error.message
        });
    }
};

const updateUserAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No avatar image file uploaded" });
    }

    try {
        const userId = req.user._id;
        const avatarUrl = `http://localhost:8000/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { avatar: avatarUrl } },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            message: "Profile picture updated successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while updating avatar",
            error: error.message
        });
    }
};

const removeUserAvatar = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { avatar: "" } },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json({
            message: "Profile picture removed successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while removing avatar",
            error: error.message
        });
    }
};

// Send Test Email
const sendTestEmailHandler = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const result = await sendTestEmail({
            to: user.email,
            userName: user.fullName,
        });

        if (result?.skipped) {
            return res.status(503).json({ message: "Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env" });
        }

        return res.status(200).json({ message: `Test email sent to ${user.email}` });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to send test email",
            error: error.message,
        });
    }
};

// Send Weekly Summary Email (can be called manually or via a cron job)
const sendWeeklySummaryHandler = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.settings?.notifEmail || !user.settings?.notifWeekly) {
            return res.status(200).json({ message: "Weekly email notifications are disabled for this user" });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const txs = await Transaction.find({ owner: user._id, date: { $gte: sevenDaysAgo } });
        const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? Math.round((Math.max(0, savings) / income) * 100) : 0;

        // Find top expense category
        const catMap = {};
        txs.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
        const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        await sendWeeklySummaryEmail({
            to: user.email,
            userName: user.fullName,
            income, expense, savings, savingsRate,
            topCategory,
            transactionCount: txs.length,
        });

        return res.status(200).json({ message: `Weekly summary sent to ${user.email}` });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to send weekly summary",
            error: error.message,
        });
    }
};

export { registerUser,
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
    };