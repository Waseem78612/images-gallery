import jwt from "jsonwebtoken";

// Middleware to verify JWT token and attach user ID to request
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token exists and has Bearer format
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Attach user ID to request
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
  }
};

export default authMiddleware;