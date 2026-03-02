import Admin from "../models/Admin.js";
import Member from "../models/Member.js";
import Invoice from "../models/Invoice.js";
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
    const inactiveClients = totalClients - activeClients;

    return res.status(200).json({
      totalClients,
      activeClients,
      inactiveClients
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSuperAdminClientsByMonth = async (_req, res) => {
  try {
    const result = await Admin.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = result.map((r) => ({ month: r._id, count: r.count }));
    return res.status(200).json({ months });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getClientDetails = async (req, res) => {
  const { adminId } = req.params;
  try {
    const admin = await Admin.findById(adminId).select("-password").lean();
    if (!admin) {
      return res.status(404).json({ message: "Client not found" });
    }

    const memberPipeline = [
      { $match: { adminId: admin._id, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: { if: "$isActive", then: 1, else: 0 } } } } }
    ];
    const invoicePipeline = [
      { $match: { adminId: admin._id, isDeleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ];
    const [memberStats, invoiceStats] = await Promise.all([
      Member.aggregate(memberPipeline),
      Invoice.aggregate(invoicePipeline)
    ]);

    const members = memberStats[0] || { total: 0, active: 0 };
    const inactiveMembers = members.total - members.active;

    const paidCount = invoiceStats.find((s) => (s._id || "").toLowerCase() === "paid")?.count ?? 0;
    const unpaidCount = invoiceStats.find((s) => (s._id || "").toLowerCase() === "unpaid")?.count ?? 0;
    const totalInvoices = paidCount + unpaidCount;

    return res.status(200).json({
      client: admin,
      totalMembers: members.total,
      activeMembers: members.active,
      inactiveMembers,
      totalInvoices,
      paidInvoices: paidCount,
      unpaidInvoices: unpaidCount
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllSuperAdmins = async (_req, res) => {
  try {
    const superAdmins = await SuperAdmin.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ superAdmins });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateSuperAdmin = async (req, res) => {
  const { superAdminId } = req.params;
  const { name, email, password, mobile } = req.body;

  try {
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    if (email !== undefined && email !== superAdmin.email) {
      const emailTaken = await isEmailTakenAcrossCollections(email);
      if (emailTaken) {
        return res.status(403).json({ message: "Email already exists" });
      }
      superAdmin.email = String(email).trim().toLowerCase();
    }
    if (name !== undefined) superAdmin.name = String(name).trim();
    if (mobile !== undefined) superAdmin.mobile = String(mobile || "");
    if (password && String(password).length >= 6) superAdmin.password = password;

    await superAdmin.save();

    const result = await SuperAdmin.findById(superAdmin._id).select("-password").lean();
    return res.status(200).json({
      message: "Super Admin updated successfully",
      superAdmin: result
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const softDeleteSuperAdmin = async (req, res) => {
  const { superAdminId } = req.params;

  try {
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    superAdmin.isActive = false;
    await superAdmin.save();

    return res.status(200).json({
      message: "Super Admin deactivated successfully",
      superAdmin: {
        userId: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        isActive: superAdmin.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSuperAdminReports = async (_req, res) => {
  try {
    const admins = await Admin.find().select("name email adminCode isActive createdAt").lean();

    const rows = admins.map((a) => ({
      adminId: a._id,
      clientName: a.name || "—",
      adminCode: a.adminCode || "—",
      status: a.isActive ? "Active" : "Inactive",
      createdAt: a.createdAt
    }));

    const totalClients = rows.length;
    const activeClients = rows.filter((r) => r.status === "Active").length;
    const inactiveClients = totalClients - activeClients;

    return res.status(200).json({
      rows,
      summary: {
        totalClients,
        activeClients,
        inactiveClients
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

