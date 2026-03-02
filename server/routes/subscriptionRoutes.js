import express from "express";
import {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin"));

// Match both "" and "/" for root path (Express passes "" when request is exactly /api/subscription)
router.post(/^\/?$/, createSubscription);
router.get(/^\/?$/, getSubscriptions);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

export default router;
