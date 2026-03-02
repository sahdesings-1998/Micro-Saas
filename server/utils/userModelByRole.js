import SuperAdmin from "../models/SuperAdmin.js";
import Admin from "../models/Admin.js";
import Member from "../models/Member.js";

export const getModelByRole = (role) => {
  if (role === "superadmin") return SuperAdmin;
  if (role === "admin") return Admin;
  if (role === "member") return Member;
  return null;
};

export const findUserByEmailAcrossCollections = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const superAdmin = await SuperAdmin.findOne({ email: normalizedEmail });
  if (superAdmin) return superAdmin;

  const admin = await Admin.findOne({ email: normalizedEmail });
  if (admin) return admin;

  const member = await Member.findOne({ email: normalizedEmail });
  if (member) return member;

  return null;
};

export const isEmailTakenAcrossCollections = async (email) => {
  const existing = await findUserByEmailAcrossCollections(email);
  return Boolean(existing);
};



