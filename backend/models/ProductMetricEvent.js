import mongoose from "mongoose";

const productMetricEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["sale", "refund"],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    fromStatus: {
      type: String,
      default: "",
    },
    toStatus: {
      type: String,
      default: "",
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "product_metric_events",
  },
);

productMetricEventSchema.index({ productId: 1, occurredAt: -1 });
productMetricEventSchema.index({ orderId: 1, productId: 1, type: 1 });

const ProductMetricEvent = mongoose.model(
  "ProductMetricEvent",
  productMetricEventSchema,
);

export default ProductMetricEvent;
