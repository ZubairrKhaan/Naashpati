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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      maxlength: [160, "Slug cannot be more than 160 characters"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot be more than 100 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      required: [true, "Short description is required"],
      maxlength: [300, "Short description cannot be more than 300 characters"],
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
    collection: {
      type: String,
      required: [true, "Product collection is required"],
      enum: ["male", "female", "both"],
      trim: true,
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Subcategory cannot be more than 100 characters"],
    },
    brand: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Brand cannot be more than 100 characters"],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [50, "Each tag cannot be more than 50 characters"],
        },
      ],
      default: [],
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Original price cannot be negative"],
    },
    salePrice: {
      type: Number,
      default: 0,
      min: [0, "Sale price cannot be negative"],
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
    barcode: {
      type: String,
      trim: true,
      default: "",
      maxlength: [128, "Barcode cannot be more than 128 characters"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
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
    thumbnail: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    attributes: {
      color: { type: String, trim: true, default: "" },
      material: { type: String, trim: true, default: "" },
      size: { type: String, trim: true, default: "" },
      lensType: { type: String, trim: true, default: "" },
      uvProtection: { type: String, trim: true, default: "" },
      frameMaterial: { type: String, trim: true, default: "" },
      author: { type: String, trim: true, default: "" },
      pages: { type: Number, min: 0, default: null },
      language: { type: String, trim: true, default: "" },
      bottleCapacity: { type: String, trim: true, default: "" },
      dimensions: { type: String, trim: true, default: "" },
    },
    shipping: {
      weight: { type: Number, min: 0, default: 0 },
      length: { type: Number, min: 0, default: 0 },
      width: { type: Number, min: 0, default: 0 },
      height: { type: Number, min: 0, default: 0 },
      freeShipping: { type: Boolean, default: false },
    },
    seo: {
      metaTitle: {
        type: String,
        trim: true,
        default: "",
        maxlength: [160, "Meta title cannot be more than 160 characters"],
      },
      metaDescription: {
        type: String,
        trim: true,
        default: "",
        maxlength: [320, "Meta description cannot be more than 320 characters"],
      },
      seoKeywords: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: [
              64,
              "Each SEO keyword cannot be more than 64 characters",
            ],
          },
        ],
        default: [],
      },
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
    showOnHomeBanner: {
      type: Boolean,
      default: false,
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

productSchema.index(
  { barcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      barcode: { $type: "string", $ne: "" },
    },
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
