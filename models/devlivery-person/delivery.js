import mongoose, { Schema } from "mongoose";

const DeliverySchema = new Schema(
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
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    vehicleType: {
      type: String,
    },
    vehicleNumber: {
      type: String,
    },
    bio: {
      type: String,
    },
    availabilities: {
      type: Boolean,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },

    otp: {
      type: Number,
    },

    otpExpiration: { type: Date },

    role: {
      type: String,
      default: "Delivery Person",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },

    rating: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

export const Delivery = mongoose.model("Delivery", DeliverySchema);
