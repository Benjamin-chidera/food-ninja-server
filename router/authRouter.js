import {Router} from "express"
import { requestNewOTP, signIn, signUp, userBio, verifyOTP} from "../controller/authController.js"


const router = Router()

router.post("/signup", signUp)
router.post("/signin", signIn)

router.patch("/user/:userId", userBio)

router.post("/verify-otp", verifyOTP); 

router.post("/request-new-otp", requestNewOTP);
// export default router

export const AuthRouter = router