import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: Number,
    },

    otpExpiration: { type: Date },

    role: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model("Admin", AdminSchema);
