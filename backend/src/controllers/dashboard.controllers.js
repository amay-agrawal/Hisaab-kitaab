import { Transaction } from "../models/transaction.models.js";
import mongoose from "mongoose";

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Perform MongoDB Aggregation Pipeline
        const stats = await Transaction.aggregate([
            // Stage 1: Match only the transactions owned by this user
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            // Stage 2: Group all matching transactions together and calculate total income vs expenses
            {
                $group: {
                    _id: null, // null groups all matched documents into a single block
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    }
                }
            },
            // Stage 3: Reshape output to calculate net balance and savings rate
            {
                $project: {
                    _id: 0, // exclude the artificial null ID from result
                    totalIncome: 1,
                    totalExpense: 1,
                    balance: { $subtract: ["$totalIncome", "$totalExpense"] },
                    savingsRate: {
                        $cond: {
                            if: { $eq: ["$totalIncome", 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$totalIncome", "$totalExpense"] },
                                            "$totalIncome"
                                        ]
                                    },
                                    100
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        // Default stats if user has 0 transactions
        const defaultStats = {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            savingsRate: 0
        };

        return res.status(200).json({
            message: "Dashboard stats fetched successfully",
            stats: stats[0] || defaultStats
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while generating dashboard stats",
            error: error.message
        });
    }
};

export { getDashboardStats };
