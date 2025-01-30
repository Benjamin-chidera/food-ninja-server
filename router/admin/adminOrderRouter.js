import { Router } from "express";
import { getAdminOrders } from "../../controller/admin/adminOrderController.js";

const router = Router();

router.get("/orders", getAdminOrders);


export const AdminOrderRouter = router;  