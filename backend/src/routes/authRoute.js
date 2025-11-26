import express from "express"
import { refreshToken, signIn, signOut, signUp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/signin", signIn);

router.post("/refresh-token", refreshToken);

router.post("/signout",signOut);


export default router;
