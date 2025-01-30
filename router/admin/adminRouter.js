import { Router } from "express";
import {
  adminSignIn,
  adminSignUp,
  adminUpdateDetails,
  forgottenPassword,
  requestNewOTP,
  resetPassword,
  verifyOTP,
  getAllUsers,
} from "../../controller/admin/adminController.js";

const router = Router();

router.post("/register-admin", adminSignUp);
router.post("/login-admin", adminSignIn);
router.post("/verify-admin", verifyOTP);
router.post("/requestNewOTP-admin", requestNewOTP);

router.post("/forgot-password", forgottenPassword);

router.patch("/reset-password/:adminId/admin", resetPassword);

// get all users
router.get("/get-all-users", getAllUsers);

export const AdminRouter = router;
