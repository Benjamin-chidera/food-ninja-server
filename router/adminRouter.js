import { Router } from "express";
import {
  adminSignIn,
  adminSignUp,
  adminUpdateDetails,
  requestNewOTP,
  verifyOTP,
} from "../controller/adminController";

const router = Router();

router.post("/register-admin", adminSignUp);
router.post("/login-admin", adminSignIn);
router.post("/verify-admin", verifyOTP);
router.post("/requestNewOTP-admin", requestNewOTP);

export const AdminRouter = router;
