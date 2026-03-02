import express from "express";
import { getMemberProfile, updateMemberProfile } from "../controllers/memberController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("member"));

router.get("/profile", getMemberProfile);
router.put("/profile", updateMemberProfile);

export default router;




