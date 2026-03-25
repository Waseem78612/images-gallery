import mongoose from "mongoose";

// Connect to MongoDB database
const connectDB = async () => {
  try {
    // Attempt database connection using URI from environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    // Log successful connection with host info
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Log connection error and exit process
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit with failure code
  }
};

export default connectDB;