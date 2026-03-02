import Invoice from "../models/Invoice.js";
import Member from "../models/Member.js";
import Subscription from "../models/Subscription.js";
import Admin from "../models/Admin.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";

const notDeleted = { isDeleted: { $ne: true } };

function addMonthsToDate(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + (months || 0));
  return result;
}

export const createInvoice = async (req, res) => {
  const { memberId, subscriptionPlanId, date, status } = req.body;

  try {
    if (!memberId) {
      return res.status(400).json({ message: "Member is required" });
    }
    if (!subscriptionPlanId) {
      return res.status(400).json({ message: "Subscription plan is required" });
    }

    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const plan = await Subscription.findOne({
      _id: subscriptionPlanId,
      adminId: req.user._id,
      ...notDeleted
    });

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    const admin = await Admin.findById(req.user._id).select("adminCode");
    const amount = Number(plan.amount);
    const duration = Number(plan.duration) || 0;
    const invoiceStatus = status === "Paid" || status === "Unpaid" ? status : "Unpaid";

    const latestInvoice = await Invoice.findOne({
      memberId: member._id,
      adminId: req.user._id,
      ...notDeleted
    })
      .sort({ dueDate: -1 })
      .select("dueDate invoiceDate")
      .lean();

    let invoiceDate;
    let dueDate;

    if (!latestInvoice || !latestInvoice.dueDate) {
      invoiceDate = date ? new Date(date) : new Date();
      dueDate = addMonthsToDate(invoiceDate, duration);
    } else {
      const prevDueDate = new Date(latestInvoice.dueDate);
      invoiceDate = prevDueDate;
      dueDate = addMonthsToDate(prevDueDate, duration);
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      adminId: req.user._id,
      adminCode: admin?.adminCode || "",
      memberId: member._id,
      memberCode: member.memberCode || "",
      memberName: member.name || "",
      companyName: member.companyName || "",
      subscriptionPlanId: plan._id,
      planName: plan.planName || "",
      duration,
      amount,
      status: invoiceStatus,
      invoiceDate,
      dueDate,
      isDeleted: false
    });

    const populated = await Invoice.findById(invoice._id)
      .populate("memberId", "name email mobile memberCode companyName")
      .populate("subscriptionPlanId", "planName amount duration")
      .lean();

    return res.status(200).json({
      message: "Invoice created successfully",
      invoice: {
        ...populated,
        memberName: populated?.memberId?.name || populated?.memberName || "",
        memberCode: populated?.memberCode || populated?.memberId?.memberCode || "",
        date: populated?.invoiceDate || populated?.date
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      adminId: req.user._id,
      ...notDeleted
    })
      .populate("memberId", "name email mobile memberCode companyName")
      .populate("subscriptionPlanId", "planName amount duration")
      .sort({ createdAt: -1 })
      .lean();

    const list = invoices.map((inv) => ({
      ...inv,
      memberCode: inv.memberCode || inv?.memberId?.memberCode || "",
      memberName: inv.memberName || inv?.memberId?.name || "",
      date: inv.invoiceDate || inv.date
    }));

    return res.status(200).json({ invoices: list });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  const { memberId, subscriptionPlanId, date, status } = req.body;

  try {
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      adminId: req.user._id,
      ...notDeleted
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (memberId) {
      const member = await Member.findOne({
        _id: memberId,
        adminId: req.user._id,
        isDeleted: { $ne: true }
      });
      if (member) {
        invoice.memberId = member._id;
        invoice.memberCode = member.memberCode || "";
        invoice.memberName = member.name || "";
        invoice.companyName = member.companyName || "";
      }
    }
    if (subscriptionPlanId) {
      const plan = await Subscription.findOne({
        _id: subscriptionPlanId,
        adminId: req.user._id,
        ...notDeleted
      });
      if (plan) {
        invoice.subscriptionPlanId = plan._id;
        invoice.planName = plan.planName || "";
        invoice.duration = plan.duration || 0;
        invoice.amount = Number(plan.amount);
      }
    }
    if (date != null) {
      invoice.invoiceDate = new Date(date);
      invoice.date = invoice.invoiceDate;
    }

    const planForDue = await Subscription.findOne({
      _id: invoice.subscriptionPlanId,
      adminId: req.user._id,
      ...notDeleted
    });
    if (planForDue) {
      const d = new Date(invoice.invoiceDate || invoice.date || new Date());
      d.setMonth(d.getMonth() + (planForDue.duration || 0));
      invoice.dueDate = d;
    }
    if (status === "Paid" || status === "Unpaid") {
      invoice.status = status;
    }

    await invoice.save();

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        date: invoice.invoiceDate || invoice.date,
        status: invoice.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const toggleInvoiceStatus = async (req, res) => {
  const { invoiceId } = req.params;

  try {
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      adminId: req.user._id,
      ...notDeleted
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.status = invoice.status === "Paid" ? "Unpaid" : "Paid";
    await invoice.save();

    return res.status(200).json({
      message: `Invoice marked as ${invoice.status}`,
      invoice: {
        _id: invoice._id,
        status: invoice.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const softDeleteInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  const { reason } = req.body;

  try {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Deletion reason is required" });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      adminId: req.user._id,
      ...notDeleted
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.isDeleted = true;
    invoice.deleteReason = reason.trim();
    invoice.deletedAt = new Date();
    await invoice.save();

    return res.status(200).json({
      message: "Invoice deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};
