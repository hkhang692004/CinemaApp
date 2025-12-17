import express from 'express'
import { authMe, getProfile, updateAvatar, changePassword } from '../controllers/userController.js';

const route = express.Router();

route.get("/me", authMe);
route.get("/profile", getProfile);
route.put("/avatar", updateAvatar);
route.put("/password", changePassword);


export default route;