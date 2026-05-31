import mongoose from "mongoose";

const productMetricSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales24h: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales7d: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales30d: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    rankingScore: {
      type: Number,
      default: 0,
      index: true,
    },
    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "product_metrics",
  },
);

productMetricSchema.index({ rankingScore: -1, sales7d: -1, updatedAt: -1 });

const ProductMetric = mongoose.model("ProductMetric", productMetricSchema);

export default ProductMetric;
