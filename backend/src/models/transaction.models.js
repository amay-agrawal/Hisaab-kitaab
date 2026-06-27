import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Food",
                "Travel",
                "Shopping",
                "Education",
                "Entertainment",
                "Health",
                "Utilities",
                "Other",
            ],
        },

        date: {
            type: Date,
            default: Date.now,
        },

        note: {
            type: String,
            trim: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

transactionSchema.index({ owner: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
