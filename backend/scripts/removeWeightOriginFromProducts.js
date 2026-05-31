import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Product from "../models/Product.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const result = await Product.updateMany(
      {
        $or: [{ weight: { $exists: true } }, { origin: { $exists: true } }],
      },
      {
        $unset: {
          weight: "",
          origin: "",
        },
      },
    );

    console.log(
      `Legacy field cleanup complete. Matched=${result.matchedCount}, Modified=${result.modifiedCount}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("Legacy field cleanup failed:", error);
    process.exit(1);
  }
};

run();
