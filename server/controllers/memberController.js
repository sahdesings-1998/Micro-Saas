import Member from "../models/Member.js";

export const getMemberProfile = async (req, res) => {
  try {
    const member = await Member.findById(req.user._id).select("-password");

    if (!member) {
      return res.status(403).json({ message: "Member not found" });
    }

    return res.status(200).json({ member });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


