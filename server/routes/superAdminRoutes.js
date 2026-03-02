import express from "express";
import {
  createSuperAdmin,
  createAdmin,
  getAllAdmins,
  getAllSuperAdmins,
  getSuperAdminReports,
  getSuperAdminStats,
  getSuperAdminClientsByMonth,
  getClientDetails,
  updateSuperAdmin,
  softDeleteAdmin,
  softDeleteSuperAdmin,
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
router.get("/clients-by-month", getSuperAdminClientsByMonth);
router.get("/reports", getSuperAdminReports);
router.get("/super-admins", getAllSuperAdmins);
router.get("/admins/:adminId/details", getClientDetails);
router.get("/client/:adminId", getClientDetails);
router.put("/super-admins/:superAdminId", updateSuperAdmin);
router.patch("/super-admins/:superAdminId/soft-delete", softDeleteSuperAdmin);

export default router;

