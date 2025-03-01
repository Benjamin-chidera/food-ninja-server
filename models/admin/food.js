import mongoose, { Schema } from "mongoose";

const foodSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    restaurant: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    isAvailable: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


export const Food = mongoose.model("Food", foodSchema);