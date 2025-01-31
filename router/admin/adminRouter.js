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
  getAllDeliveryPerson,
  getDeliveryPersonDataById,
  editDeliveryPersonData,
  addNewDeliveryPerson,
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

// get all delivery person
router.get("/get-all-delivery-person", getAllDeliveryPerson);

// get a delivery person by id
router.get("/get-delivery-person/:id", getDeliveryPersonDataById);

// edit delivery person details
router.patch("/edit-delivery-person/:id", editDeliveryPersonData);

// this is to add a new delivery person
router.post("/add-delivery-person", addNewDeliveryPerson);
export const AdminRouter = router;
