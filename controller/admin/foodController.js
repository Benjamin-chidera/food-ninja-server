import expressAsyncHandler from "express-async-handler";
import { Food } from "../../models/admin/food.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const createFood = (io) =>
    expressAsyncHandler(async (req, res) => {
      const { name, price, category, description, tags, isAvailable } = req.body;
  
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
          .json({ message: "Error uploading photo", error: error.message });
      }
  
      try {
        // Create the new food item in the database with the correct image URL
        const food = await Food.create({
          name,
          price,
          image: foodImageUrl, // Save the Cloudinary URL in the database
          category,
          description,
          tags: tags.split(","), // Convert tags to an array if sent as a string
          isAvailable: isAvailable === "true", // Convert isAvailable to boolean
        });
  
        // Emit a Socket.IO event to notify connected users about the new food
        io.emit("newFoodCreated", food);
  
        // Respond with the newly created food
        res.status(201).json({ success: true, food });
      } catch (error) {
        res.status(500).json({ message: "Error creating food", error: error.message });
      }
    });
  

export const getAllFood = expressAsyncHandler(async (req, res) => {
  const foods = await Food.find();
  res.status(200).json({ success: true, foods });
});
