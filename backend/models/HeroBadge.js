import mongoose from "mongoose";

const heroBadgeSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      default: [],
    },
    genderImages: {
      female: {
        type: String,
        trim: true,
        default: "",
      },
      male: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  { timestamps: true },
);

const HeroBadge = mongoose.model("HeroBadge", heroBadgeSchema);

export default HeroBadge;
