import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    batch_number: {
      type: String,
      required: true,
      trim: true,
      maxlength: [64, "Batch number cannot be more than 64 characters"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
    },
    remaining_quantity: {
      type: Number,
      required: true,
      min: [0, "Remaining quantity cannot be negative"],
    },
    cost_price: {
      type: Number,
      required: true,
      min: [0, "Cost price cannot be negative"],
    },
    purchase_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

batchSchema.index({ product_id: 1, purchase_date: 1 });
batchSchema.index({ product_id: 1, batch_number: 1 });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
