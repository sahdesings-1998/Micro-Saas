import Member from "../models/Member.js";
import Admin from "../models/Admin.js";
import { generateAdminCode } from "../utils/adminCode.js";
import { generateMemberCode } from "../utils/memberCode.js";
import { isEmailTakenAcrossCollections } from "../utils/userModelByRole.js";

export const createMember = async (req, res) => {
  const { name, email, password, mobile, revenue } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(401).json({ message: "Name, email, and password are required" });
    }

    const emailTaken = await isEmailTakenAcrossCollections(email);
    if (emailTaken) {
      return res.status(403).json({ message: "Email already exists" });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    // Self-heal legacy admin records that were created before adminCode was introduced.
    if (!admin.adminCode || !admin.adminCode.trim()) {
      admin.adminCode = await generateAdminCode();
      await admin.save();
    }

    const memberCode = await generateMemberCode();

    const member = await Member.create({
      name,
      email,
      password,
      memberCode,
      mobile: mobile || "",
      adminId: admin._id,
      adminCode: admin.adminCode,
      isActive: true,
      revenue: Number(revenue || 0)
    });

    return res.status(200).json({
      message: "Member created successfully",
      member: {
        userId: member._id,
        memberCode: member.memberCode,
        name: member.name,
        email: member.email,
        mobile: member.mobile,
        role: member.role,
        adminId: member.adminId,
        adminCode: member.adminCode,
        isActive: member.isActive,
        createdAt: member.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyMembers = async (req, res) => {
  try {
    const members = await Member.find({ adminId: req.user._id })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ members });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleMemberStatus = async (req, res) => {
  const { memberId } = req.params;

  try {
    const member = await Member.findOne({ _id: memberId, adminId: req.user._id });

    if (!member) {
      return res.status(403).json({ message: "Member not found" });
    }

    member.isActive = !member.isActive;
    if (member.isActive) {
      member.deletedAt = null;
      member.deleteReason = "";
    }
    await member.save();

    return res.status(200).json({
      message: `Member ${member.isActive ? "activated" : "deactivated"} successfully`,
      member: {
        userId: member._id,
        memberCode: member.memberCode,
        name: member.name,
        email: member.email,
        isActive: member.isActive
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const softDeleteMember = async (req, res) => {
  const { memberId } = req.params;
  const { reason } = req.body;

  try {
    if (!reason || !reason.trim()) {
      return res.status(401).json({ message: "Deletion reason is required" });
    }

    const member = await Member.findOne({ _id: memberId, adminId: req.user._id });
    if (!member) {
      return res.status(403).json({ message: "Member not found" });
    }

    member.isActive = false;
    member.deletedAt = new Date();
    member.deleteReason = reason.trim();
    await member.save();

    return res.status(200).json({
      message: "Member soft deleted successfully",
      member: {
        userId: member._id,
        memberCode: member.memberCode,
        name: member.name,
        email: member.email,
        isActive: member.isActive,
        deletedAt: member.deletedAt,
        deleteReason: member.deleteReason
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments({ adminId: req.user._id });
    const activeMembers = await Member.countDocuments({ adminId: req.user._id, isActive: true });

    const revenueStats = await Member.aggregate([
      { $match: { adminId: req.user._id } },
      { $group: { _id: null, totalRevenue: { $sum: "$revenue" } } }
    ]);

    const totalRevenue = revenueStats.length ? revenueStats[0].totalRevenue : 0;

    return res.status(200).json({
      totalMembers,
      activeMembers,
      totalRevenue
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminReports = async (req, res) => {
  const { date } = req.query;

  try {
    const matchStage = { adminId: req.user._id };

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

