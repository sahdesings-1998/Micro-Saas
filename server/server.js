import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import { allowRoles } from "./middleware/roleMiddleware.js";
import {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription
} from "./controllers/subscriptionController.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API running"));
app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminRoutes);

// Subscription routes - explicit paths ensure POST /api/subscription works
app.post("/api/subscription", protect, allowRoles("admin"), createSubscription);
app.get("/api/subscription", protect, allowRoles("admin"), getSubscriptions);
app.put("/api/subscription/:id", protect, allowRoles("admin"), updateSubscription);
app.delete("/api/subscription/:id", protect, allowRoles("admin"), deleteSubscription);
app.use("/api/member", memberRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
