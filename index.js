import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import fileupload from "express-fileupload";
import { errorHandler } from "./middleware/errorHandler.js";
import { AuthRouter } from "./router/authRouter.js";
import { DeliveryRouter } from "./router/deliveryRouter.js";
import { AdminRouter } from "./router/adminRouter.js";

dotenv.config();

const PORT = 3000;
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.use(
  fileupload({
    useTempFiles: true,
  })
);

app.use(express.json());
app.use(cors());
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("WELCOME TO FOOD NINJA");
});

// This is the user section
app.use("/api/v1/food-ninja/auth", AuthRouter);

// This is the delivery section
app.use("/api/v1/food-ninja/auth", DeliveryRouter);

// This is the admin section
app.use("/api/v1/food-ninja/auth", AdminRouter);

const server = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      dbName: "food-ninja",
    });

    app.listen(PORT, () => {
      console.log(`Running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

server();
