import mongoose from "mongoose";

const saleOfferSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sale name is required"],
      trim: true,
      minlength: [2, "Sale name must be at least 2 characters"],
      maxlength: [100, "Sale name cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    banner: {
      type: String,
      required: [true, "Sale banner is required"],
      trim: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
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

const SaleOffer = mongoose.model("SaleOffer", saleOfferSchema);

export default SaleOffer;
