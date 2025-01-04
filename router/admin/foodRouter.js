import express from "express";
import { createFood,getAllFood } from "../../controller/admin/foodController.js";

export const FoodRouter = (io) => {
  const router = express.Router();

  // Pass the Socket.IO instance to the createFood controller
  router.post("/create", createFood(io));
  router.get("/all-food", getAllFood);

  return router;
};
