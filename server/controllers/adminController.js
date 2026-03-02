import Member from "../models/Member.js";
import Admin from "../models/Admin.js";
import Subscription from "../models/Subscription.js";
import Invoice from "../models/Invoice.js";
import { generateAdminCode } from "../utils/adminCode.js";
import { generateMemberCode } from "../utils/memberCode.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import { isEmailTakenAcrossCollections } from "../utils/userModelByRole.js";

const memberNotDeleted = { isDeleted: { $ne: true } };
const invoiceNotDeleted = { isDeleted: { $ne: true } };

export const createMember = async (req, res) => {
  const { name, email, password, mobile, companyName, subscriptionPlanId, startDate } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const emailTaken = await isEmailTakenAcrossCollections(email);
    if (emailTaken) {
      return res.status(403).json({ message: "Email already exists" });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    if (!admin.adminCode || !admin.adminCode.trim()) {
      admin.adminCode = await generateAdminCode();
      await admin.save();
    }

    const plan = await Subscription.findOne({
      _id: subscriptionPlanId,
      adminId: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan is required" });
    }

    const memberCode = await generateMemberCode();
    const invoiceDate = startDate ? new Date(startDate) : new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setMonth(dueDate.getMonth() + (plan.duration || 0));

    const member = await Member.create({
      name,
      email,
      password,
      memberCode,
      mobile: mobile || "",
      companyName: companyName || "",
      adminId: admin._id,
      adminCode: admin.adminCode || "",
      isActive: true
    });

    const invoiceNumber = await generateInvoiceNumber();
    await Invoice.create({
      invoiceNumber,
      adminId: admin._id,
      adminCode: admin.adminCode || "",
      memberId: member._id,
      memberCode: member.memberCode || "",
      memberName: member.name || "",
      companyName: member.companyName || "",
      subscriptionPlanId: plan._id,
      planName: plan.planName || "",
      duration: plan.duration || 0,
      amount: plan.amount,
      status: "Unpaid",
      invoiceDate,
      dueDate
    });

    const populated = await Member.findById(member._id).select("-password").lean();

    return res.status(200).json({
      message: "Member created successfully",
      member: formatMemberResponse(populated)
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateMember = async (req, res) => {
  const { memberId } = req.params;
  const { name, email, password, mobile, companyName, isActive } = req.body;

  try {
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id,
      ...memberNotDeleted
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Partial update: only modify fields that are explicitly provided
    if (email !== undefined && email !== member.email) {
      const emailTaken = await isEmailTakenAcrossCollections(email);
      if (emailTaken) {
        return res.status(403).json({ message: "Email already exists" });
      }
      member.email = String(email).trim().toLowerCase();
    }
    if (name !== undefined) member.name = String(name).trim();
    if (mobile !== undefined) member.mobile = String(mobile);
    if (companyName !== undefined) member.companyName = String(companyName || "").trim();
    if (password && String(password).length >= 6) member.password = password;

    if (typeof isActive === "boolean" && isActive !== member.isActive) {
      member.isActive = isActive;
      member.statusUpdatedAt = new Date();
    }

    await member.save();

    const populated = await Member.findById(member._id).select("-password").lean();

    return res.status(200).json({
      message: "Member updated successfully",
      member: formatMemberResponse(populated)
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

function formatMemberResponse(m) {
  if (!m) return null;
  return {
    _id: m._id,
    userId: m._id,
    memberCode: m.memberCode,
    name: m.name,
    companyName: m.companyName || "",
    email: m.email,
    mobile: m.mobile,
    role: m.role,
    adminId: m.adminId,
    adminCode: m.adminCode,
    isActive: m.isActive,
    statusReason: m.statusReason || "",
    statusUpdatedAt: m.statusUpdatedAt || null,
    createdAt: m.createdAt
  };
}

export const getMyMembers = async (req, res) => {
  try {
    const members = await Member.find({
      adminId: req.user._id,
      ...memberNotDeleted
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const list = members.map((m) => formatMemberResponse(m));
    return res.status(200).json({ members: list });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const toggleMemberStatus = async (req, res) => {
  const { memberId } = req.params;

  try {
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id,
      ...memberNotDeleted
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.isActive = !member.isActive;
    if (member.isActive) {
      member.deletedAt = null;
      member.deleteReason = "";
    }
    await member.save();

    return res.status(200).json({
      message: `Member ${member.isActive ? "activated" : "deactivated"} successfully`,
      member: formatMemberResponse(member)
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const softDeleteMember = async (req, res) => {
  const { memberId } = req.params;
  const { reason } = req.body;

  try {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Deletion reason is required" });
    }

    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id,
      ...memberNotDeleted
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.isDeleted = true;
    member.isActive = false;
    member.deletedAt = new Date();
    member.deleteReason = reason.trim();
    await member.save();

    await Invoice.updateMany(
      { memberId: member._id, adminId: req.user._id },
      { isDeleted: true, deletedAt: new Date(), deleteReason: reason.trim() }
    );

    return res.status(200).json({
      message: "Member deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const adminId = req.user._id;
    const baseMatch = { adminId, ...memberNotDeleted };

    const totalMembers = await Member.countDocuments(baseMatch);
    const activeMembers = await Member.countDocuments({ ...baseMatch, isActive: true });
    const inactiveMembers = totalMembers - activeMembers;

    const [revenueResult, paidMemberIds, allMemberIdsWithInvoices] = await Promise.all([
      Invoice.aggregate([
        { $match: { adminId, ...invoiceNotDeleted, status: "Paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
      ]),
      Invoice.distinct("memberId", { adminId, ...invoiceNotDeleted, status: "Paid" }),
      Invoice.distinct("memberId", { adminId, ...invoiceNotDeleted })
    ]);

    const totalRevenue = revenueResult.length ? revenueResult[0].totalRevenue : 0;
    const paidSet = new Set(paidMemberIds.map((id) => String(id)));
    const allWithInvoicesSet = new Set(allMemberIdsWithInvoices.map((id) => String(id)));
    const paidMembers = paidSet.size;
    const unpaidMembers = Math.max(0, allWithInvoicesSet.size - paidSet.size);

    return res.status(200).json({
      totalMembers,
      activeMembers,
      inactiveMembers,
      paidMembers,
      unpaidMembers,
      totalRevenue
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminRevenueByMonth = async (req, res) => {
  try {
    const adminId = req.user._id;
    const result = await Invoice.aggregate([
      { $match: { adminId, ...invoiceNotDeleted, status: "Paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$invoiceDate", "$date"] } } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = result.map((r) => ({ month: r._id, revenue: r.revenue }));
    return res.status(200).json({ months });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminReports = async (req, res) => {
  const { date } = req.query;

  try {
    const adminId = req.user._id;
    const memberMatch = { adminId, ...memberNotDeleted };
    const invoiceBaseMatch = { adminId, ...invoiceNotDeleted, status: "Paid" };

    let invoicePipeline = [{ $match: invoiceBaseMatch }];
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      memberMatch.createdAt = { $gte: startDate, $lt: endDate };
      invoicePipeline.push({
        $addFields: { resolvedDate: { $ifNull: ["$invoiceDate", "$date"] } }
      });
      invoicePipeline.push({
        $match: { resolvedDate: { $gte: startDate, $lt: endDate } }
      });
    }
    invoicePipeline = invoicePipeline.concat([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$invoiceDate", "$date"] } } },
          totalRevenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const [memberRows, invoiceRows] = await Promise.all([
      Member.aggregate([
        { $match: memberMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            totalUsers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Invoice.aggregate(invoicePipeline)
    ]);

    const usersByMonth = Object.fromEntries(memberRows.map((r) => [r._id, r.totalUsers]));
    const revenueByMonth = Object.fromEntries(invoiceRows.map((r) => [r._id, r.totalRevenue]));
    const allMonths = [...new Set([...memberRows.map((r) => r._id), ...invoiceRows.map((r) => r._id)])].sort();
    const rows = allMonths.map((month) => ({
      label: month,
      totalUsers: usersByMonth[month] || 0,
      totalRevenue: revenueByMonth[month] || 0
    }));

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password").lean();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json(admin);
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateAdminProfile = async (req, res) => {
  const { name, email, mobile, companyName } = req.body;
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    let changed = false;
    if (name !== undefined && String(name || "").trim() !== (admin.name || "")) {
      admin.name = String(name).trim();
      changed = true;
    }
    if (email !== undefined && String(email || "").trim().toLowerCase() !== (admin.email || "")) {
      const emailTaken = await isEmailTakenAcrossCollections(email);
      if (emailTaken) {
        return res.status(403).json({ message: "Email already exists" });
      }
      admin.email = String(email).trim().toLowerCase();
      changed = true;
    }
    if (mobile !== undefined && String(mobile || "").trim() !== (admin.mobile || "")) {
      admin.mobile = String(mobile || "").trim();
      changed = true;
    }
    if (companyName !== undefined && String(companyName || "").trim() !== (admin.companyName || "")) {
      admin.companyName = String(companyName || "").trim();
      changed = true;
    }
    if (!changed) {
      const result = await Admin.findById(admin._id).select("-password").lean();
      return res.status(200).json(result);
    }
    await admin.save();
    const result = await Admin.findById(admin._id).select("-password").lean();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};
