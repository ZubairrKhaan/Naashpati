import mongoose from "mongoose";

const redactMongoUri = (uri = "") => {
  if (!uri) {
    return "";
  }

  return uri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/i, "$1$2:***@");
};

const connectDB = async () => {
  try {
    console.log("====================");
    console.log("[DEBUG] NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "[DEBUG] MONGODB_URI:",
      redactMongoUri(process.env.MONGODB_URI),
    );
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
