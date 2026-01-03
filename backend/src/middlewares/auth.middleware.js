import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.startsWith("Bearer") &&
      req.headers.authorization.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    res.status(401).json({ message: "Token failed" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Admin only" });

  next();
};
