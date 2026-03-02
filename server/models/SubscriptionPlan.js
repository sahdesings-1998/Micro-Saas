import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    isDeleted: { type: Boolean, default: false },
    deleteReason: { type: String, default: "" },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ adminId: 1 });
subscriptionPlanSchema.index({ adminId: 1, isDeleted: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
export default SubscriptionPlan;
