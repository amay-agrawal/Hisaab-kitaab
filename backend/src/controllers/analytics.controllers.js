import { Transaction } from "../models/transaction.models.js";
import mongoose from "mongoose";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getAnalyticsStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Perform Parallel Multi-Pipeline Aggregation using $facet
        const aggregationResult = await Transaction.aggregate([
            // Stage 1: Match only the transactions owned by this user
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            // Stage 2: $facet runs both pipelines in parallel
            {
                $facet: {
                    // Pipeline A: Monthly income & expense trends
                    monthlyTrends: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$date" },
                                    month: { $month: "$date" }
                                },
                                income: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                                    }
                                },
                                expense: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                                    }
                                }
                            }
                        },
                        // Sort by year and month index ascending to arrange chronologically
                        {
                            $sort: {
                                "_id.year": 1,
                                "_id.month": 1
                            }
                        },
                        // Limit to the last 6 months
                        {
                            $limit: 12 // We get the last 12 and then slice 6, or just get last 6
                        }
                    ],

                    // Pipeline B: Category expense breakdown
                    categoryBreakdown: [
                        // We only care about expenses for category distributions
                        {
                            $match: {
                                type: "expense"
                            }
                        },
                        {
                            $group: {
                                _id: "$category",
                                value: { $sum: "$amount" }
                            }
                        },
                        // Sort by value descending (highest expense categories first)
                        {
                            $sort: {
                                value: -1
                            }
                        }
                    ]
                }
            }
        ]);

        const rawMonthly = aggregationResult[0]?.monthlyTrends || [];
        const rawCategory = aggregationResult[0]?.categoryBreakdown || [];

        // 1. Post-process monthly trends to match frontend charting format
        const monthlyData = rawMonthly
            .slice(-6) // take last 6 months
            .map((item) => {
                const monthIdx = item._id.month - 1; // MongoDB months are 1-12
                return {
                    month: MONTH_NAMES[monthIdx] || "Unknown",
                    income: item.income,
                    expense: item.expense,
                    savings: Math.max(0, item.income - item.expense),
                    year: item._id.year,
                    monthIdx
                };
            });

        // 2. Post-process category breakdown to match frontend chart formatting
        const categoryData = rawCategory.map((item) => ({
            name: item._id,
            value: item.value
        }));

        return res.status(200).json({
            message: "Analytics statistics fetched successfully",
            monthlyData,
            categoryData
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while generating analytics stats",
            error: error.message
        });
    }
};

export { getAnalyticsStats };
