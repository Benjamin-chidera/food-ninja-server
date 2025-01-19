import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    item: Array,
    totalAmount: Number,
    paymentStatus: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    // createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
