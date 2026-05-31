import mongoose from "mongoose";

const heroBadgeSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const HeroBadge = mongoose.model("HeroBadge", heroBadgeSchema);

export default HeroBadge;
