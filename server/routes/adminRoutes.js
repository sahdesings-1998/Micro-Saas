import express from "express";
import {
  createMember,
  getAdminReports,
  getAdminStats,
  getMyMembers,
  softDeleteMember,
  toggleMemberStatus
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.post("/members", createMember);
router.get("/members", getMyMembers);
router.patch("/members/:memberId/status", toggleMemberStatus);
router.patch("/members/:memberId/soft-delete", softDeleteMember);
router.get("/stats", getAdminStats);
router.get("/dashboard", getAdminStats);
router.get("/reports", getAdminReports);

export default router;

