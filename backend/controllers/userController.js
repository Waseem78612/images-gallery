import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/userModel.js";

/* ── helper: sign JWT ── */
const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* ─────────────────────────────────────────────────────────── */
/* POST /api/user/register                                     */
/* ─────────────────────────────────────────────────────────── */
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validation
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required." });

    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    // ── Duplicate check
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ success: false, message: "An account with this email already exists." });

    // ── Create user
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });

    const token = createToken(user._id);
    console.log(`✅ Registered: ${user.email}`);

    return res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* POST /api/user/login                                        */
/* ─────────────────────────────────────────────────────────── */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const token = createToken(user._id);
    console.log(`✅ Login: ${user.email}`);

    return res.json({
      success: true,
      token,
      user: { _id: user._id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* GET /api/user/me   — requires Bearer token                  */
/* ─────────────────────────────────────────────────────────── */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("getMe error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* GET /api/user/:id  — get any user by MongoDB _id            */
/* ─────────────────────────────────────────────────────────── */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("getUserById error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* GET /api/user/all  — list every user (dev/admin)            */
/* ─────────────────────────────────────────────────────────── */
export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("getAllUsers error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
