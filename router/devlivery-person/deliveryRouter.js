import { Router } from "express";
import {
  registerDelivery,
  loginDelivery,
  verifyOTP,
  requestNewOTP,
  forgottenPassword,
  resetPassword,
} from "../../controller/devlivery-person/deliveryAuthController.js";

const router = Router();

router.post("/register-delivery-person", registerDelivery);
router.post("/login-delivery-person", loginDelivery);
router.post("/verify-delivery-person", verifyOTP);
router.post("/requestNewOTP-delivery-person", requestNewOTP);

router.post("/forgot-password-delivery-person", forgottenPassword);

router.patch("/reset-password/:deliveryId/delivery-person", resetPassword);

export const DeliveryRouter = router;
