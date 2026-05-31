import mongoose from "mongoose";

const productBannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Banner image is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const ProductBanner = mongoose.model("ProductBanner", productBannerSchema);

export default ProductBanner;
