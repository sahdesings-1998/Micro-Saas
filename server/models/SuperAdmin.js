import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    mobile: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["superadmin"],
      default: "superadmin"
    }
  },
  { timestamps: true }
);

superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

superAdminSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
export default SuperAdmin;



