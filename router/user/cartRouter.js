import { addToCart, getCart, removeFromCart } from "../../controller/user/cartController.js";
import { Router } from "express";

const router = Router();

router.post("/add-to-cart", addToCart);
router.post("/remove-from-cart", removeFromCart);
router.get("/get-cart", getCart);

export const CartRouter = router;
