import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    item: Array,
    totalAmount: Number,
    paymentStatus: String,
    orderId: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },

    status: {
      type: String,
      enum: ["Placed", "Preparing", "In Transit", "Delivered"],
      default: "Placed",
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
