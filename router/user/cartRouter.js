import {
  addToCart,
  getCart,
  removeFromCart,
  incrementQuantity,
  decreaseQuantity
} from "../../controller/user/cartController.js";
import { Router } from "express";

const router = Router();

router.post("/add-to-cart", addToCart);
router.post("/remove-from-cart", removeFromCart);
router.get("/get-cart/:userId", getCart);
router.patch("/updateQuantity/:userId/:foodId", incrementQuantity);
router.patch("/reduceQuantity/:userId/:foodId", decreaseQuantity);

export const CartRouter = router;
