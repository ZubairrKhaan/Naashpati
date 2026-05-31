import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: [2000, "Review cannot be more than 2000 characters"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot be more than 100 characters"],
      default: "",
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, "Display name cannot be more than 100 characters"],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot be more than 254 characters"],
      default: "",
    },
    media: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
      mediaType: {
        type: String,
        enum: ["image", "video", ""],
        default: "",
      },
    },
  },
  {
    timestamps: true,
  },
);

const questionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Question cannot be more than 2000 characters"],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, "Display name cannot be more than 100 characters"],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot be more than 254 characters"],
      default: "",
    },
    answer: {
      type: String,
      trim: true,
      maxlength: [3000, "Answer cannot be more than 3000 characters"],
      default: "",
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    briefDescription: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Brief description cannot be more than 2000 characters",
      ],
      default: "",
    },
    briefDescriptionPoints: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [
            300,
            "Each brief description point cannot exceed 300 characters",
          ],
        },
      ],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [64, "SKU cannot be more than 64 characters"],
      match: [
        /^[A-Z0-9_-]+$/,
        "SKU can only contain letters, numbers, hyphens, and underscores",
      ],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    helpsTo: {
      type: String,
      trim: true,
      maxlength: [600, "Helps to content cannot be more than 600 characters"],
      default: "",
    },
    directions: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [300, "Each direction step cannot exceed 300 characters"],
        },
      ],
      default: [],
    },
    servingSize: {
      type: String,
      trim: true,
      maxlength: [200, "Serving size cannot be more than 200 characters"],
      default: "",
    },
    instructionsContent: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Instructions content cannot be more than 2000 characters",
      ],
      default: "",
    },
    faqContent: {
      type: String,
      trim: true,
      maxlength: [10000, "FAQ content cannot be more than 10000 characters"],
      default: "",
    },
    qualityPromiseContent: {
      type: String,
      trim: true,
      maxlength: [
        3000,
        "Quality promise content cannot be more than 3000 characters",
      ],
      default: "",
    },
    ingredients: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            maxlength: [150, "Ingredient name cannot exceed 150 characters"],
          },
          amount: {
            type: String,
            trim: true,
            maxlength: [100, "Ingredient amount cannot exceed 100 characters"],
          },
        },
      ],
      default: [],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    image: {
      type: String,
      default: "",
    },
    reviews: [reviewSchema],
    questions: [questionSchema],
    numReviews: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Trending metrics (for weekly tracking)
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    recentSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    previousPeriodSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    addToCartCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    trendingScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    // Track when metrics were last reset/updated
    metricsLastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate average rating when reviews are added/updated
productSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = sum / this.reviews.length;
  } else {
    this.rating = 0;
  }
  this.numReviews = this.reviews.length;
};

const Product = mongoose.model("Product", productSchema);

export default Product;
