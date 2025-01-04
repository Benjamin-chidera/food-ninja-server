import { Router } from "express";
import {
  requestNewOTP,
  signIn,
  signUp,
  userBio,
  verifyOTP,
  forgottenPassword,
  resetPassword,
  getUser,
  deleteUserAccount
} from "../controller/authController.js";

const router = Router();

router.post("/signup", signUp);

router.post("/signin", signIn);

router.get("/user/:userId", getUser);

router.patch("/user/:userId", userBio);

router.post("/verify-otp", verifyOTP);

router.post("/request-new-otp", requestNewOTP);

router.post("/forgot-password", forgottenPassword);

router.patch("/reset-password/:userId", resetPassword);

router.delete("/user/:userId", deleteUserAccount)

// export default router

export const AuthRouter = router;
