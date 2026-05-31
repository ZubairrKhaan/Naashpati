import mongoose from "mongoose";

const aboutContentSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    facilityHeading: {
      type: String,
      trim: true,
      default: "Pakistan's Largest Nutraceutical Manufacturing Facility",
      maxlength: [180, "Heading cannot be more than 180 characters"],
    },
    facilityDescription: {
      type: String,
      trim: true,
      default:
        "With over a decade of experience, Naashpati specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.",
      maxlength: [1200, "Description cannot be more than 1200 characters"],
    },
    facilityImages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 3,
        message: "You can store up to 3 facility images",
      },
    },
    scienceHeading: {
      type: String,
      trim: true,
      default: "We Are Backed By Science",
      maxlength: [180, "Science heading too long"],
    },
    scienceDescription: {
      type: String,
      trim: true,
      default:
        "Naashpati delivers high-quality, safe products crafted under expert supervision and aligned with global standards. Committed to GMP, HACCP, ISO systems, and compliance-driven quality controls, we ensure excellence at every stage.",
      maxlength: [1200, "Science description too long"],
    },
    scienceBadgeImages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 8,
        message: "You can store up to 8 badge images",
      },
    },
    scienceImage: {
      type: String,
      trim: true,
      default: "",
    },
    whyNutrifactorHeading: {
      type: String,
      trim: true,
      default: "WHY NUTRIFACTOR!",
      maxlength: [180, "Why section heading too long"],
    },
    whyNutrifactorDescription: {
      type: String,
      trim: true,
      default:
        "Nutrifactor stands out from other nutraceutical brands due to our values of transparency and traceability in delivering high-quality natural healthcare products. Our commitment to excellence encompasses sustainable sourcing, integrity across all levels, and rigorous testing methods exceeding usual standard practices. We strive to bridge the gap between consumers and nutraceuticals science by being transparent in our labels. All the health benefits listed on our products are strictly in accordance with the scientific research.",
      maxlength: [1400, "Why section description too long"],
    },
    whyNutrifactorImage: {
      type: String,
      trim: true,
      default: "",
    },
    missionHeading: {
      type: String,
      trim: true,
      default: "Bridging Ancient Wisdom with Modern Wellness",
      maxlength: [180, "Mission heading too long"],
    },
    missionDescription: {
      type: String,
      trim: true,
      default:
        "For centuries, herbal traditions have guided communities toward balance and vitality. At Naashpati, we honour that heritage by making it accessible, transparent, and trustworthy for the modern world. From the highland farms of Morocco to the tropical forests of Sri Lanka, we trace every ingredient back to its origin and share that journey with you because you deserve to know exactly what you're putting in your body.",
      maxlength: [1500, "Mission description too long"],
    },
    missionImage: {
      type: String,
      trim: true,
      default: "",
    },
    healthPriorityHeading: {
      type: String,
      trim: true,
      default: "YOUR HEALTH, OUR PRIORITY",
      maxlength: [180, "Health priority heading too long"],
    },
    healthPriorityItems: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            default: "",
            maxlength: [180, "Health priority item title too long"],
          },
          description: {
            type: String,
            trim: true,
            default: "",
            maxlength: [1000, "Health priority item description too long"],
          },
        },
      ],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 3,
        message: "You can store up to 3 health priority text items",
      },
    },
    healthPriorityImages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 4,
        message: "You can store up to 4 health priority images",
      },
    },
    teamMembers: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: "",
            maxlength: [120, "Team member name too long"],
          },
          role: {
            type: String,
            trim: true,
            default: "",
            maxlength: [180, "Team member role too long"],
          },
          bio: {
            type: String,
            trim: true,
            default: "",
            maxlength: [1000, "Team member bio too long"],
          },
          image: {
            type: String,
            trim: true,
            default: "",
          },
        },
      ],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 12,
        message: "You can store up to 12 team members",
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const AboutContent = mongoose.model("AboutContent", aboutContentSchema);

export default AboutContent;
