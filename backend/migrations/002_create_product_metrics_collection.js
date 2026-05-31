import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  await db
    .collection("product_metrics")
    .createIndex(
      { productId: 1 },
      { unique: true, name: "ux_product_metrics_product" },
    );
  await db
    .collection("product_metrics")
    .createIndex(
      { rankingScore: -1, sales7d: -1, updatedAt: -1 },
      { name: "ix_product_metrics_rank" },
    );

  await db
    .collection("product_metric_events")
    .createIndex(
      { eventId: 1 },
      { unique: true, name: "ux_product_metric_events_event" },
    );
  await db
    .collection("product_metric_events")
    .createIndex(
      { productId: 1, occurredAt: -1 },
      { name: "ix_product_metric_events_product_occurred" },
    );
  await db
    .collection("product_metric_events")
    .createIndex(
      { orderId: 1, productId: 1, type: 1 },
      { name: "ix_product_metric_events_order_product_type" },
    );

  await db
    .collection("products")
    .createIndex(
      { isActive: 1, stock: 1, category: 1 },
      { name: "ix_products_active_stock_category" },
    );

  console.log("[Migration] Product metrics indexes created");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("[Migration] Failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
