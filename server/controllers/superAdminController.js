import Admin from "../models/Admin.js";
import Member from "../models/Member.js";
import SuperAdmin from "../models/SuperAdmin.js";
import { generateAdminCode } from "../utils/adminCode.js";
import { isEmailTakenAcrossCollections } from "../utils/userModelByRole.js";

export const createAdmin = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(401).json({ message: "Name, email, and password are required" });
    }

    const emailTaken = await isEmailTakenAcrossCollections(email);
    if (emailTaken) {
      return res.status(403).json({ message: "Email already exists" });
    }

    const adminCode = await generateAdminCode();

    const admin = await Admin.create({
      name,
      email,
      password,
      adminCode,
      mobile: mobile || "",
      isActive: true
    });

    return res.status(200).json({
      message: "Admin created successfully",
      admin: {
        userId: admin._id,
        name: admin.name,
        email: admin.email,
        adminCode: admin.adminCode,
        mobile: admin.mobile,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createSuperAdmin = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(401).json({ message: "Name, email, and password are required" });
    }

    const emailTaken = await isEmailTakenAcrossCollections(email);
    if (emailTaken) {
      return res.status(403).json({ message: "Email already exists" });
    }

    const superAdmin = await SuperAdmin.create({
      name,
      email,
      password,
      mobile: mobile || "",
      isActive: true
    });

    return res.status(200).json({
      message: "Super Admin created successfully",
      superAdmin: {
        userId: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        mobile: superAdmin.mobile,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        createdAt: superAdmin.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ admins });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleAdminStatus = async (req, res) => {
  const { adminId } = req.params;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    admin.isActive = !admin.isActive;
    if (admin.isActive) {
      admin.deletedAt = null;
      admin.deleteReason = "";
    }
    await admin.save();

    return res.status(200).json({
      message: `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
      admin: {
        userId: admin._id,
        name: admin.name,
        email: admin.email,
        adminCode: admin.adminCode,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const softDeleteAdmin = async (req, res) => {
  const { adminId } = req.params;
  const { reason } = req.body;

  try {
    if (!reason || !reason.trim()) {
      return res.status(401).json({ message: "Deletion reason is required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    admin.isActive = false;
    admin.deletedAt = new Date();
    admin.deleteReason = reason.trim();
    await admin.save();

    return res.status(200).json({
      message: "Admin soft deleted successfully",
      admin: {
        userId: admin._id,
        name: admin.name,
        email: admin.email,
        adminCode: admin.adminCode,
        isActive: admin.isActive,
        deletedAt: admin.deletedAt,
        deleteReason: admin.deleteReason
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSuperAdminStats = async (_req, res) => {
  try {
    const totalClients = await Admin.countDocuments();
    const activeClients = await Admin.countDocuments({ isActive: true });
    const totalMembers = await Member.countDocuments();

    const revenueStats = await Member.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$revenue" } } }
    ]);

    const totalRevenue = revenueStats.length ? revenueStats[0].totalRevenue : 0;

    return res.status(200).json({
      totalClients,
      activeClients,
      totalMembers,
      totalRevenue
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSuperAdminReports = async (req, res) => {
  const { date } = req.query;

  try {
    const matchStage = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      matchStage.createdAt = { $gte: startDate, $lt: endDate };
    }

    const reportRows = await Member.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalUsers: { $sum: 1 },
          totalRevenue: { $sum: "$revenue" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const rows = reportRows.map((row) => ({
      label: row._id,
      totalUsers: row.totalUsers,
      totalRevenue: row.totalRevenue
    }));

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

