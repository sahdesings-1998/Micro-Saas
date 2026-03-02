import Member from "../models/Member.js";
import Invoice from "../models/Invoice.js";

const notDeleted = { isDeleted: { $ne: true } };

export const getMemberProfile = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.user._id,
      ...notDeleted
    })
      .select("-password")
      .lean();

    if (!member) {
      return res.status(403).json({ message: "Member not found" });
    }

    const invoices = await Invoice.find({
      memberId: member._id,
      ...notDeleted
    })
      .sort({ dueDate: -1 })
      .lean();

    const totalInvoices = invoices.length;
    const totalPaidAmount = invoices
      .filter((inv) => (inv.status || "").toLowerCase() === "paid")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalUnpaidAmount = invoices
      .filter((inv) => (inv.status || "").toLowerCase() !== "paid")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    const latestInvoice = invoices[0] || null;
    const currentPlan = latestInvoice
      ? {
          planName: latestInvoice.planName || "—",
          amount: latestInvoice.amount ?? 0,
          duration: latestInvoice.duration ?? 0,
          startDate: latestInvoice.invoiceDate || latestInvoice.date,
          nextDueDate: latestInvoice.dueDate,
          status: latestInvoice.status || "Unpaid",
        }
      : null;

    return res.status(200).json({
      member,
      invoices,
      totalInvoices,
      totalPaidAmount,
      totalUnpaidAmount,
      currentPlan,
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateMemberProfile = async (req, res) => {
  const { name, email, mobile, companyName } = req.body;
  try {
    const member = await Member.findOne({
      _id: req.user._id,
      ...notDeleted
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    let changed = false;
    if (name !== undefined && String(name || "").trim() !== (member.name || "")) {
      member.name = String(name).trim();
      changed = true;
    }
    if (email !== undefined && String(email || "").trim().toLowerCase() !== (member.email || "")) {
      const emailExists = await Member.findOne({
        email: String(email).trim().toLowerCase(),
        _id: { $ne: member._id },
        ...notDeleted
      });
      if (emailExists) {
        return res.status(403).json({ message: "Email already exists" });
      }
      member.email = String(email).trim().toLowerCase();
      changed = true;
    }
    if (mobile !== undefined && String(mobile || "").trim() !== (member.mobile || "")) {
      member.mobile = String(mobile || "").trim();
      changed = true;
    }
    if (companyName !== undefined && String(companyName || "").trim() !== (member.companyName || "")) {
      member.companyName = String(companyName || "").trim();
      changed = true;
    }

    if (!changed) {
      const result = await Member.findById(member._id).select("-password").lean();
      return res.status(200).json(result);
    }

    await member.save();
    const result = await Member.findById(member._id).select("-password").lean();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};


