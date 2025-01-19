import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import fileupload from "express-fileupload";
import { errorHandler } from "./middleware/errorHandler.js";
import { AuthRouter } from "./router/user/authRouter.js";
import { DeliveryRouter } from "./router/devlivery-person/deliveryRouter.js";
import { AdminRouter } from "./router/admin/adminRouter.js";
import { FoodRouter } from "./router/admin/foodRouter.js";
import { FavoriteRouter } from "./router/user/favoriteRoute.js";
import { CartRouter } from "./router/user/cartRouter.js";
import { PaymentRouter } from "./router/user/paymentRouter.js";
import { OrderRouter } from "./router/user/orderRouter.js";


import { createServer } from "http";
import { Server } from "socket.io";
import { Food } from "./models/admin/food.js";
import { Auth } from "./models/user/auth.js";
import { Order } from "./models/user/order.js";

dotenv.config();

const PORT = 3000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (adjust as needed)
    methods: ["GET", "POST"],
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Middleware setup
app.use(fileupload({ useTempFiles: true }));
app.use(express.json());
app.use(cors());
app.use(errorHandler);

// Basic route
app.get("/", (req, res) => {
  res.send("WELCOME TO FOOD NINJA");
});

// Routers
app.use("/api/v1/food-ninja/auth", AuthRouter);
app.use("/api/v1/food-ninja/delivery", DeliveryRouter);
app.use("/api/v1/food-ninja/admin", AdminRouter);
app.use("/api/v1/food-ninja/food", FoodRouter(io)); // Pass io to FoodRouter
app.use("/api/v1/food-ninja/food", FavoriteRouter);
app.use("/api/v1/food-ninja/cart", CartRouter);
app.use("/api/v1/food-ninja/payment", PaymentRouter);
app.use("/api/v1/food-ninja/order", OrderRouter);

// strip webhook

app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (request, response) => {
    // Make this function async
    const event = request.body;

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // console.log(paymentIntent.status);

        // if (paymentIntent.status === "succeeded") {
        //   const userId = paymentIntent.metadata.user;
        //   console.log(userId);
        // }

        try {
          if (paymentIntent.status === "succeeded") {
            const userId = paymentIntent.metadata.user;
            // console.log(userId);
            const user = await Auth.findById(userId);

            const getOrder = await Food.find({
              _id: { $in: user.cart.map((item) => item.foodId) },
            });

            console.log(getOrder);

            // creating the order
            const order = new Order({
              item: getOrder,
              totalAmount: paymentIntent.amount / 100,
              paymentStatus: paymentIntent.status,
              user: userId,
            });

            await order.save();

            // clearing the cart
            user.cart = [];
            await user.save();

            
          }
        } catch (error) {
          console.log(error);
        }

        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Handle successful attachment of a PaymentMethod

        break;
      // Handle other event types here
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

// strip webhook

app.use("*", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example: Listen for events
  socket.on("sendMessage", (message) => {
    console.log("Message received:", message);
    io.emit("receiveMessage", message);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start server
const server = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      dbName: "food-ninja",
    });

    httpServer.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

server();
