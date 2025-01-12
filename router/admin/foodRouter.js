import express from "express";
import {
  createFood,
  getAllFood,
  getFoodById,
  updateFood,
} from "../../controller/admin/foodController.js";

export const FoodRouter = (io) => {
  const router = express.Router();

  // Pass the Socket.IO instance to the createFood controller
  router.post("/create", createFood(io));
  router.get("/all-food", getAllFood);
  router.get("/food/:id", getFoodById);
  router.patch("/food/:foodId", updateFood(io));

  return router;
};
