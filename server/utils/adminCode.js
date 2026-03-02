import Admin from "../models/Admin.js";

export const generateAdminCode = async () => {
  const latestAdmin = await Admin.findOne({ adminCode: { $regex: /^ADM-\d+$/ } })
    .sort({ createdAt: -1 })
    .select("adminCode");

  if (!latestAdmin?.adminCode) {
    return "ADM-0001";
  }

  const lastNumber = Number(latestAdmin.adminCode.split("-")[1] || 0);
  const nextNumber = String(lastNumber + 1).padStart(4, "0");
  return `ADM-${nextNumber}`;
};



