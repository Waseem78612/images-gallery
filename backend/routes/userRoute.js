import express from "express";
import { registerUser, loginUser, getMe, getAllUsers, getUserById } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

// Public routes (no auth)
userRouter.post("/register", registerUser); // Register new user
userRouter.post("/login", loginUser); // Login user

// Protected routes (require auth)
userRouter.get("/me", authMiddleware, getMe); // Get current user profile
userRouter.get("/all", getAllUsers); // Get all users (admin/dev)

// Wildcard route - must come last
userRouter.get("/:id", getUserById); // Get user by ID

export default userRouter;