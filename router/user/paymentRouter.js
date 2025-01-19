import express, { Router } from "express";
import {
  paymentRequest,
  // handleWebhook,
} from "../../controller/user/paymentController.js";

const router = Router();

router.post("/request-payment", paymentRequest);

export const PaymentRouter = router;

// Route for handling Stripe webhook
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   handleWebhook
// );
