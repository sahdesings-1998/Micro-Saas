import express from "express";
import {
  createSuperAdmin,
  createAdmin,
  getAllAdmins,
  getSuperAdminReports,
  getSuperAdminStats,
  softDeleteAdmin,
  toggleAdminStatus
} from "../controllers/superAdminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("superadmin"));

router.post("/admins", createAdmin);
router.post("/super-admins", createSuperAdmin);
router.get("/admins", getAllAdmins);
router.patch("/admins/:adminId/status", toggleAdminStatus);
router.patch("/admins/:adminId/soft-delete", softDeleteAdmin);
router.get("/stats", getSuperAdminStats);
router.get("/dashboard", getSuperAdminStats);
router.get("/reports", getSuperAdminReports);

export default router;

