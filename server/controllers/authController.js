import jwt from "jsonwebtoken";
import { findUserByEmailAcrossCollections } from "../utils/userModelByRole.js";

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(401).json({ message: "Email and password are required" });
    }

    const user = await findUserByEmailAcrossCollections(email);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    return res.json({
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        isActive: user.isActive,
        adminId: user.adminId
      },
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  return res.json(req.user);
};
