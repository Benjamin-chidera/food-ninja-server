import { Router } from "express";
import { getOrders } from "../../controller/user/orderController.js";

const router = Router();

router.get("/:userId", getOrders);

export const OrderRouter = router;