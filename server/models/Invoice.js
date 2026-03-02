import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    adminCode: { type: String, default: "" },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true
    },
    memberCode: { type: String, default: "" },
    memberName: { type: String, default: "" },
    companyName: { type: String, default: "" },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null
    },
    planName: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    invoiceDate: { type: Date, required: true, default: Date.now },
    date: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deleteReason: { type: String, default: "" }
  },
  { timestamps: true }
);

invoiceSchema.index({ adminId: 1 });
invoiceSchema.index({ memberId: 1 });
invoiceSchema.index({ adminId: 1, isDeleted: 1 });
invoiceSchema.index({ memberId: 1, adminId: 1, isDeleted: 1, dueDate: -1 });

invoiceSchema.pre("save", function (next) {
  if (this.invoiceDate && !this.date) this.date = this.invoiceDate;
  if (this.date && !this.invoiceDate) this.invoiceDate = this.date;
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
