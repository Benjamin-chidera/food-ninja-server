import {
  registerDelivery,
  loginDelivery,
  verifyOTP,
  requestNewOTP
} from "../controller/deliveryAuthController.js";
import { Router } from "express";

const router = Router();

router.post("/register-delivery-person", registerDelivery);
router.post("/login-delivery-person", loginDelivery);
router.post("/verify-delivery-person", verifyOTP)
router.post("/requestNewOTP-delivery-person", requestNewOTP)

export const DeliveryRouter = router;
