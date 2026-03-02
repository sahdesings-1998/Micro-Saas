import Member from "../models/Member.js";

export const generateMemberCode = async () => {
  const latestMember = await Member.findOne({ memberCode: { $regex: /^MID-\d+$/ } })
    .sort({ createdAt: -1 })
    .select("memberCode");

  if (!latestMember?.memberCode) {
    return "MID-0001";
  }

  const lastNumber = Number(latestMember.memberCode.split("-")[1] || 0);
  const nextNumber = String(lastNumber + 1).padStart(4, "0");
  return `MID-${nextNumber}`;
};



