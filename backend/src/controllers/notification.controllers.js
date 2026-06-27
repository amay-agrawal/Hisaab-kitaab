import { Notification } from "../models/notification.models.js";
import mongoose from "mongoose";

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("sender", "fullName username avatar")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while fetching notifications",
            error: error.message
        });
    }
};

const markRead = async (req, res) => {
    const { notifId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notifId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
    }

    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: notifId, recipient: req.user._id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({
            message: "Notification marked as read successfully",
            notification: notif
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while marking notification as read",
            error: error.message
        });
    }
};

const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            message: "All notifications marked as read successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while marking all notifications as read",
            error: error.message
        });
    }
};

const deleteNotification = async (req, res) => {
    const { notifId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notifId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
    }

    try {
        const notif = await Notification.findOneAndDelete({
            _id: notifId,
            recipient: req.user._id
        });

        if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({
            message: "Notification deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while deleting notification",
            error: error.message
        });
    }
};

export { getNotifications, markRead, markAllRead, deleteNotification };
