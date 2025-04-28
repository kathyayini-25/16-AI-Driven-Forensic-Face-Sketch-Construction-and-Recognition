
import express from "express";
import { ChangePass, Login, Register } from "../actions/auth.actions.js";
const router = express.Router();

router.post("/login",Login);
router.post("/register",Register);
router.post("/change-password",ChangePass);

export default router;

