import { Transaction } from "../models/transaction.models.js";
import { User } from "../models/user.models.js";
import { sendBudgetAlertEmail } from "../utils/email.service.js";

// 1. Create Transaction
const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date, note } = req.body;

        // Validation: title, amount, type, category are required fields.
        if (!title || !amount || !type || !category) {
            return res.status(400).json({
                message: "Title, amount, type, and category are required fields.",
            });
        }

        const transaction = await Transaction.create({
            title,
            amount,
            type,
            category,
            date: date || undefined,
            note,
            owner: req.user._id,
        });

        // ── Budget Alert Email (fire-and-forget, don't block response) ──
        if (type === "expense") {
            (async () => {
                try {
                    const user = await User.findById(req.user._id);
                    if (!user?.settings?.notifEmail || !user?.settings?.notifBudget) return;

                    const budgetLimit = user.budgets?.get(category);
                    if (!budgetLimit || budgetLimit <= 0) return;

                    // Sum all expenses in this category for the current calendar month
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const agg = await Transaction.aggregate([
                        { $match: { owner: user._id, type: "expense", category, date: { $gte: monthStart } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    const monthlySpent = agg[0]?.total || 0;

                    // Send alert if at 80% or over budget
                    const pct = monthlySpent / budgetLimit;
                    if (pct >= 0.8) {
                        await sendBudgetAlertEmail({
                            to: user.email,
                            userName: user.fullName,
                            category,
                            spent: monthlySpent,
                            budget: budgetLimit,
                        });
                    }
                } catch (e) {
                    console.error("Budget alert email error:", e.message);
                }
            })();
        }

        return res.status(201).json({
            message: "Transaction created successfully",
            transaction,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while creating transaction",
            error: error.message,
        });
    }
};

// 2. Get All Transactions for Logged-in User
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ owner: req.user._id }).sort({ date: -1 });
        return res.status(200).json({
            message: "Transactions fetched successfully",
            transactions,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while fetching transactions",
            error: error.message,
        });
    }
};

// 3. Update Transaction
const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, type, category, date, note } = req.body;

        // Find the transaction by ID
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Authorization Check: ensure the logged-in user owns this transaction
        if (transaction.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not have permission to update this transaction" });
        }

        // Update fields if provided
        transaction.title = title || transaction.title;
        transaction.amount = amount !== undefined ? amount : transaction.amount;
        transaction.type = type || transaction.type;
        transaction.category = category || transaction.category;
        transaction.date = date || transaction.date;
        transaction.note = note !== undefined ? note : transaction.note;

        const updatedTransaction = await transaction.save();

        return res.status(200).json({
            message: "Transaction updated successfully",
            transaction: updatedTransaction,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while updating transaction",
            error: error.message,
        });
    }
};

// 4. Delete Transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the transaction by ID
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Authorization Check: ensure the logged-in user owns this transaction
        if (transaction.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not have permission to delete this transaction" });
        }

        await transaction.deleteOne();

        return res.status(200).json({
            message: "Transaction deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error while deleting transaction",
            error: error.message,
        });
    }
};

const bulkInsertTransactions = async (req, res) => {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ message: "Invalid or empty transactions array" });
    }

    try {
        const formatted = transactions.map(t => ({
            owner: req.user._id,
            amount: Number(t.amount) || 0,
            category: t.category || "Other",
            title: t.title || t.description || "Imported transaction",
            type: t.type || "expense",
            date: t.date ? new Date(t.date) : new Date()
        }));

        const inserted = await Transaction.insertMany(formatted);
        return res.status(201).json({
            message: `${inserted.length} transactions imported successfully`,
            inserted
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while importing transactions",
            error: error.message
        });
    }
};

const clearAllTransactions = async (req, res) => {
    try {
        await Transaction.deleteMany({ owner: req.user._id });
        return res.status(200).json({
            message: "All transactions cleared successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong while clearing transactions",
            error: error.message
        });
    }
};

export {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    bulkInsertTransactions,
    clearAllTransactions
};