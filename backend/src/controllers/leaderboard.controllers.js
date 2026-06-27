import { User } from "../models/user.models.js";
import { Follow } from "../models/follow.models.js";
import mongoose from "mongoose";

const getLeaderboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const { filter } = req.query;

        // Build matching stage for aggregation
        const matchStage = {};
        if (filter === "following") {
            const followings = await Follow.find({ follower: userId }).select("following");
            const followingIds = followings.map((f) => f.following);
            followingIds.push(userId); // Always include the current user on their following leaderboard
            matchStage._id = { $in: followingIds };
        } else if (filter === "followers") {
            const followers = await Follow.find({ following: userId }).select("follower");
            const followerIds = followers.map((f) => f.follower);
            followerIds.push(userId); // Always include the current user on their followers leaderboard
            matchStage._id = { $in: followerIds };
        }

        const pipeline = [
            // Stage 1: Optional filtering (Following only vs Global)
            {
                $match: matchStage
            },
            // Stage 2: Lookup transactions for each user
            {
                $lookup: {
                    from: "transactions", // collection name in MongoDB
                    localField: "_id",
                    foreignField: "owner",
                    as: "transactions"
                }
            },
            // Stage 3: Calculate total income and expense from transactions array
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    income: {
                        $sum: {
                            $map: {
                                input: "$transactions",
                                as: "tx",
                                in: {
                                    $cond: [{ $eq: ["$$tx.type", "income"] }, "$$tx.amount", 0]
                                }
                            }
                        }
                    },
                    expense: {
                        $sum: {
                            $map: {
                                input: "$transactions",
                                as: "tx",
                                in: {
                                    $cond: [{ $eq: ["$$tx.type", "expense"] }, "$$tx.amount", 0]
                                }
                            }
                        }
                    }
                }
            },
            // Stage 4: Calculate savings and savingsRate
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    income: 1,
                    savings: { $subtract: ["$income", "$expense"] },
                    savingsRate: {
                        $cond: {
                            if: { $eq: ["$income", 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$income", "$expense"] },
                                            "$income"
                                        ]
                                    },
                                    100
                                ]
                            }
                        }
                    }
                }
            },
            // Stage 5: Map values to match frontend format and redact other users' financial data
            {
                $project: {
                    _id: 1,
                    name: "$fullName",
                    username: 1,
                    avatar: 1,
                    points: {
                        $max: [0, { $round: [{ $multiply: ["$savingsRate", 10] }] }]
                    },
                    isMe: { $eq: ["$_id", new mongoose.Types.ObjectId(userId)] },
                    // Redaction Guard: Only allow the logged-in user to see their own numbers
                    income: {
                        $cond: [
                            { $eq: ["$_id", new mongoose.Types.ObjectId(userId)] },
                            "$income",
                            null // Send null to prevent leaking data
                        ]
                    },
                    savings: {
                        $cond: [
                            { $eq: ["$_id", new mongoose.Types.ObjectId(userId)] },
                            "$savings",
                            null // Send null to prevent leaking data
                        ]
                    }
                }
            },
            // Stage 6: Join follows collection to check if the current user follows this leaderboard entry
            {
                $lookup: {
                    from: "follows",
                    let: { entryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$follower", new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ["$following", "$$entryId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followRecord"
                }
            },
            // Stage 7: Add isFollowing flag
            {
                $addFields: {
                    isFollowing: { $gt: [{ $size: "$followRecord" }, 0] }
                }
            },
            // Stage 8: Remove temporary join field
            {
                $project: {
                    followRecord: 0
                }
            },
            // Stage 9: Sort by points descending (and alphabetically as tie-breaker)
            {
                $sort: {
                    points: -1,
                    name: 1
                }
            }
        ];

        const leaderboard = await User.aggregate(pipeline);

        return res.status(200).json({
            message: "Leaderboard stats fetched successfully",
            leaderboard
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while generating leaderboard stats",
            error: error.message
        });
    }
};

export { getLeaderboard };
