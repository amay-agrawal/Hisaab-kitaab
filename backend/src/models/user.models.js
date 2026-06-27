import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String
    },
    settings: {
      currency: { type: String, default: "INR" },
      language: { type: String, default: "en" },
      compactMode: { type: Boolean, default: false },
      animationsEnabled: { type: Boolean, default: true },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      notifWeekly: { type: Boolean, default: true },
      notifBudget: { type: Boolean, default: true },
      notifLeaderboard: { type: Boolean, default: false },
      notifMilestones: { type: Boolean, default: false },
      notifEmail: { type: Boolean, default: true },
      notifPush: { type: Boolean, default: false },
      profilePublic: { type: Boolean, default: true },
      showOnLeaderboard: { type: Boolean, default: true },
      shareAnalytics: { type: Boolean, default: false },
      sessionTimeout: { type: String, default: "30" }
    },
    budgets: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);
userSchema.methods.isPasswordCorrect = async function(password) {

    return await bcrypt.compare(
        password,
        this.password
    );

};
userSchema.methods.generateAccessToken = function () {

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );

};
userSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );

};
export const User = mongoose.model(
  "User",
  userSchema
);