import express        from "express";
import {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  getUserById,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

/* ── RULE: specific named routes ALWAYS before /:id wildcard ── */

/* Public */
userRouter.post("/register", registerUser);               // POST /api/user/register
userRouter.post("/login",    loginUser);                  // POST /api/user/login

/* Named GET routes — must be before /:id */
userRouter.get("/me",  authMiddleware, getMe);            // GET  /api/user/me   (auth)
userRouter.get("/all", getAllUsers);                       // GET  /api/user/all  (dev)

/* Wildcard — comes LAST */
userRouter.get("/:id", getUserById);                      // GET  /api/user/:id

export default userRouter;
