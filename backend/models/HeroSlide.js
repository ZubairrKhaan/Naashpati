import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Hero image is required"],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Title cannot be more than 120 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: [220, "Subtitle cannot be more than 220 characters"],
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

const HeroSlide = mongoose.model("HeroSlide", heroSlideSchema);

export default HeroSlide;
