import { Router } from "express";
import {
  getAdminOrders,
  getSingleOrder,
  updateOrderStatus,
} from "../../controller/admin/adminOrderController.js";

const router = Router();

router.get("/orders", getAdminOrders);
router.get("/orders/:id", getSingleOrder);
router.patch("/orders/:id", updateOrderStatus);

export const AdminOrderRouter = router;
