import express from "express";
import { getMemberProfile } from "../controllers/memberController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("member"));

router.get("/profile", getMemberProfile);

export default router;



