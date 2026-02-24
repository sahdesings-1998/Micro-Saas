import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    memberCode: { type: String, required: true, unique: true, trim: true, immutable: true },
    mobile: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deleteReason: { type: String, default: "" },
    revenue: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["member"],
      default: "member"
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    adminCode: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

memberSchema.index({ adminId: 1 });
memberSchema.index({ adminCode: 1 });

memberSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

memberSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Member = mongoose.model("Member", memberSchema);
export default Member;

