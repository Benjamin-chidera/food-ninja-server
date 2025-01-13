import expressAsyncHandler from "express-async-handler";
import { Food } from "../../models/admin/food.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const createFood = (io) =>
  expressAsyncHandler(async (req, res) => {
    const {
      name,
      price,
      category,
      description,
      tags,
      isAvailable,
      restaurant,
    } = req.body;

    // Ensure the uploaded file exists
    const foodImage =
      req.files && req.files.image ? req.files.image.tempFilePath : null;

    if (!foodImage) {
      return res
        .status(400)
        .json({ message: "No image file received. Please upload an image." });
    }

    let foodImageUrl = null;

    try {
      // Upload the image to Cloudinary
      const foodImg = await cloudinary.uploader.upload(foodImage, {
        folder: "food-ninja",
        use_filename: true,
        resource_type: "auto",
      });

      // Get the secure URL of the uploaded image
      foodImageUrl = foodImg.secure_url;

      // Delete the temporary file after successful upload
      fs.unlinkSync(foodImage);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error uploading photo", message: error });
    }

    try {
      const food = await Food.create({
        name,
        price,
        image: foodImageUrl,
        category,
        description,
        tags: tags.split(","),
        isAvailable,
        restaurant,
      });

      // Emit a Socket.IO event to notify connected users about the new food
      io.emit("newFoodCreated", food);

      // Respond with the newly created food
      res.status(201).json({ success: true, food });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating food", error: error.message });
    }
  });

export const getAllFood = expressAsyncHandler(async (req, res) => {
  const foods = await Food.find();
  res.status(200).json({ success: true, foods });
});

export const getFoodById = expressAsyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }
  res.status(200).json({ success: true, food });
});

export const updateFood = expressAsyncHandler(async (req, res) => {
  const { foodId } = req.params;

  const { name, price, category, description, tags, isAvailable, restaurant } =
    req.body;

  // Check if the food item exists
  const existingFood = await Food.findById(foodId);

  if (!existingFood) {
    return res
      .status(400)
      .json({ success: false, message: "Food ID not found" });
  }

  const foodDetails = {};

  // Update fields selectively
  if (name) foodDetails.name = name;
  if (price) foodDetails.price = price;
  if (category) foodDetails.category = category;
  if (description) foodDetails.description = description;
  if (tags) foodDetails.tags = tags ? tags.split(",") : existingFood.tags;
  if (typeof isAvailable !== "undefined") foodDetails.isAvailable = isAvailable;
  if (restaurant) foodDetails.restaurant = restaurant;

  // Handle image upload if provided
  if (req.files && req.files.image) {
    const foodImages = req.files.image.tempFilePath;

    try {
      // Delete old image from Cloudinary
      if (existingFood.image) {
        const publicId = existingFood.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`food-ninja/${publicId}`);
      }

      // Upload new image
      const foodImg = await cloudinary.uploader.upload(foodImages, {
        folder: "food-ninja",
        use_filename: true,
        resource_type: "auto",
      });

      foodDetails.image = foodImg.secure_url;

      // Delete temporary file
      fs.unlinkSync(foodImages);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Image upload failed: ${error.message}`,
      });
    }
  }

  try {
    // Update the food item in the database
    const updatedFood = await Food.findByIdAndUpdate(foodId, foodDetails, {
      new: true,
      runValidators: true,
    });

    // io.emit("newFoodCreated", updatedFood);

    res.status(200).json({
      success: true,
      food: updatedFood,
      message: "Food updated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Update failed: ${error.message}` });
  }
});

export const deleteFood = async (req, res) => {
  const { foodId } = req.params;

  try {
    const food = await Food.findByIdAndDelete(foodId);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    if (food.image) {
      const publicId = food.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`food-ninja/${publicId}`);
    }

    res
      .status(200)
      .json({ success: true, message: "Food deleted successfully" });

    // Delete image from Cloudinary
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Delete failed: ${error}` });
  }
};
