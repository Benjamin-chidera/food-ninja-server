import mongoose, { Schema } from "mongoose";

const authSchema = new Schema(
  {
    email: {
      required: true,
      type: String,
      unique: true,
    },

    password: {
      required: true,
      type: String,
      minLength: 7,
    },

    firstName: {
      type: String,
    },

    lastName: {
      type: String,
    },

    phoneNumber: {
      type: String,
    },

    photo: {
      type: String,
    },

    location: {
      type: String,
    },

    otp: {
      type: Number,
    },

    role: {
      type: String,
      default: "Customer",
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
      },
    ],

    cart: [
      {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number, default: 1 },
      },
    ],

    otpExpiration: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Auth = mongoose.model("Auth", authSchema);
