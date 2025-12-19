import express from "express";
import {
  refreshToken,
  sendResetOTP,
  signIn,
  signOut,
  signUp,
  verifyOTPandReset,
  getMe,
} from "../controllers/authController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/signin", signIn);

router.post("/refresh-token", refreshToken);

router.post("/signout", signOut);

router.post("/send-otp", sendResetOTP);

router.post("/reset-password", verifyOTPandReset);

router.get("/me", protectedRoute, getMe);

export default router;
