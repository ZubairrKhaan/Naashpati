import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("====================");
    console.log("[DEBUG] NODE_ENV:", process.env.NODE_ENV);
    console.log("[DEBUG] MONGODB_URI:", process.env.MONGODB_URI);
    console.log("====================");
    process.stdout.write(""); // flush output
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
