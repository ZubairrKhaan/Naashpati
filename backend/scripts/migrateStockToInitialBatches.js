import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const products = await Product.find({ isActive: true }).select(
      "_id stock costPrice",
    );

    let migrated = 0;
    let skipped = 0;

    for (const product of products) {
      const stock = Number(product.stock || 0);
      if (stock <= 0) {
        skipped += 1;
        continue;
      }

      const existingBatches = await Batch.countDocuments({
        product_id: product._id,
      });
      if (existingBatches > 0) {
        skipped += 1;
        continue;
      }

      await Batch.create({
        product_id: product._id,
        batch_number: "INITIAL",
        quantity: stock,
        remaining_quantity: stock,
        cost_price: Number(product.costPrice || 0),
        purchase_date: new Date(),
        expiry_date: null,
      });

      migrated += 1;
    }

    console.log(
      `Stock migration complete. Migrated=${migrated}, Skipped=${skipped}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Stock migration failed:", error);
    process.exit(1);
  }
};

run();
