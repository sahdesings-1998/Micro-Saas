import express from "express";
import {
  createMember,
  getAdminProfile,
  getAdminReports,
  getAdminRevenueByMonth,
  getAdminStats,
  getMyMembers,
  softDeleteMember,
  toggleMemberStatus,
  updateAdminProfile,
  updateMember
} from "../controllers/adminController.js";
import {
  createInvoice,
  getMyInvoices,
  softDeleteInvoice,
  toggleInvoiceStatus,
  updateInvoice
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.post("/members", createMember);
router.get("/members", getMyMembers);
router.put("/members/:memberId", updateMember);
router.patch("/members/:memberId/status", toggleMemberStatus);
router.patch("/members/:memberId/soft-delete", softDeleteMember);

router.get("/invoices", getMyInvoices);
router.post("/invoices", createInvoice);
router.put("/invoices/:invoiceId", updateInvoice);
router.patch("/invoices/:invoiceId/status", toggleInvoiceStatus);
router.patch("/invoices/:invoiceId/soft-delete", softDeleteInvoice);

router.get("/stats", getAdminStats);
router.get("/dashboard", getAdminStats);
router.get("/reports", getAdminReports);
router.get("/revenue-by-month", getAdminRevenueByMonth);
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);

export default router;

