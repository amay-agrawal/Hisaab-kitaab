import { Follow } from "../models/follow.models.js";
import { User } from "../models/user.models.js";
import { Notification } from "../models/notification.models.js";
import mongoose from "mongoose";

const toggleFollow = async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: "Invalid target user ID" });
    }

    if (userId.toString() === targetUserId.toString()) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }

    try {
        // Confirm target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Check if follow record already exists
        const existingFollow = await Follow.findOne({
            follower: userId,
            following: targetUserId
        });

        if (existingFollow) {
            // Unfollow
            await Follow.findByIdAndDelete(existingFollow._id);
            return res.status(200).json({
                message: "Unfollowed successfully",
                isFollowing: false
            });
        } else {
            // Follow
            await Follow.create({
                follower: userId,
                following: targetUserId
            });

            // Create follow notification for the followed user
            await Notification.create({
                recipient: targetUserId,
                sender: userId,
                type: "follow",
                title: "New Follower",
                message: `${req.user.fullName} (@${req.user.username}) started following you!`
            });

            return res.status(200).json({
                message: "Followed successfully",
                isFollowing: true
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while toggling follow",
            error: error.message
        });
    }
};

const getFollowers = async (req, res) => {
    const { targetUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: "Invalid target user ID" });
    }

    try {
        const followers = await Follow.find({ following: targetUserId })
            .populate("follower", "fullName username avatar")
            .select("-following -createdAt -updatedAt");

        return res.status(200).json({
            message: "Followers fetched successfully",
            followers: followers.map(f => f.follower)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while fetching followers",
            error: error.message
        });
    }
};

const getFollowing = async (req, res) => {
    const { targetUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ message: "Invalid target user ID" });
    }

    try {
        const following = await Follow.find({ follower: targetUserId })
            .populate("following", "fullName username avatar")
            .select("-follower -createdAt -updatedAt");

        return res.status(200).json({
            message: "Following list fetched successfully",
            following: following.map(f => f.following)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while fetching following list",
            error: error.message
        });
    }
};

export { toggleFollow, getFollowers, getFollowing };
