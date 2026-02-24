import jwt from "jsonwebtoken";
import { getModelByRole } from "../utils/userModelByRole.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const UserModel = getModelByRole(decoded.role);

    if (!UserModel) {
      return res.status(401).json({ message: "Invalid user role in token" });
    }

    req.user = await UserModel.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
