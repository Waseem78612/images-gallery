import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type:     String,
      required: [true, "Username is required"],
      trim:     true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      trim:     true,
      lowercase: true,
    },
    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
