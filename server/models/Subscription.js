import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    adminCode: { type: String, default: "" },
    adminName: { type: String, default: "" },
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "subscriptions" }
);

subscriptionSchema.index({ adminId: 1 });
subscriptionSchema.index({ adminId: 1, isDeleted: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
