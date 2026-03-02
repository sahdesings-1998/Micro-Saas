import Subscription from "../models/Subscription.js";
import Admin from "../models/Admin.js";

const notDeleted = { isDeleted: { $ne: true } };

export const createSubscription = async (req, res) => {
  const { planName, amount, duration, description } = req.body;
  const adminId = req.user._id || req.user.id;

  const admin = await Admin.findById(adminId).select("adminCode name");
  const adminCode = admin?.adminCode || req.user?.adminCode || "";
  const adminName = admin?.name || req.user?.name || "";

  try {
    const trimmedName = planName != null ? String(planName).trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ message: "Plan name is required" });
    }
    const numAmount = Number(amount);
    const numDuration = Number(duration);
    if (Number.isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }
    if (Number.isNaN(numDuration) || numDuration < 1) {
      return res.status(400).json({ message: "Duration must be at least 1 month" });
    }

    const subscription = await Subscription.create({
      adminId,
      adminCode,
      adminName,
      planName: trimmedName,
      amount: numAmount,
      duration: numDuration,
      description: (description || "").trim(),
      isDeleted: false
    });

    return res.status(200).json({
      message: "Subscription plan created successfully",
      plan: {
        _id: subscription._id,
        adminId: subscription.adminId,
        adminCode: subscription.adminCode,
        adminName: subscription.adminName,
        planName: subscription.planName,
        amount: subscription.amount,
        duration: subscription.duration,
        description: subscription.description,
        isDeleted: subscription.isDeleted,
        createdAt: subscription.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getSubscriptions = async (req, res) => {
  const adminId = req.user._id || req.user.id;

  try {
    const plans = await Subscription.find({
      adminId,
      ...notDeleted
    }).sort({ createdAt: -1 });

    return res.status(200).json({ plans });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { planName, amount, duration, description } = req.body;
  const adminId = req.user._id || req.user.id;

  try {
    const plan = await Subscription.findOne({
      _id: id,
      adminId,
      ...notDeleted
    });

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    if (planName != null) {
      const trimmed = String(planName).trim();
      if (!trimmed) return res.status(400).json({ message: "Plan name cannot be empty" });
      plan.planName = trimmed;
    }
    if (amount != null) {
      const numAmount = Number(amount);
      if (Number.isNaN(numAmount) || numAmount < 0)
        return res.status(400).json({ message: "Valid amount is required" });
      plan.amount = numAmount;
    }
    if (duration != null) {
      const numDuration = Number(duration);
      if (Number.isNaN(numDuration) || numDuration < 1)
        return res.status(400).json({ message: "Duration must be at least 1 month" });
      plan.duration = numDuration;
    }
    if (description != null) plan.description = String(description || "").trim();

    await plan.save();

    return res.status(200).json({
      message: "Subscription plan updated successfully",
      plan: {
        _id: plan._id,
        planName: plan.planName,
        amount: plan.amount,
        duration: plan.duration,
        description: plan.description
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const deleteSubscription = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id || req.user.id;

  try {
    const plan = await Subscription.findOne({
      _id: id,
      adminId,
      ...notDeleted
    });

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    plan.isDeleted = true;
    await plan.save();

    return res.status(200).json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};
