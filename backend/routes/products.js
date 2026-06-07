import express from "express";
import { body } from "express-validator";
import Category from "../models/Category.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  createProductQuestion,
  answerProductQuestion,
  deleteProductQuestionAnswer,
  deleteProductReview,
  deleteProductQuestion,
  getCategories,
} from "../controllers/productController.js";
import {
  getTrendingProducts,
  recordView,
  recordCart,
  recordSale,
  clearCache,
} from "../controllers/trendingProductController.js";
import { protect, optionalProtect, authorize } from "../middleware/auth.js";

const router = express.Router();

const isValidBriefPoints = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every(
    (point) =>
      typeof point === "string" &&
      point.trim().length > 0 &&
      point.trim().length <= 300,
  );
};

const isArrayOrCommaSeparatedString = (value) => {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === "string");
  }
  return typeof value === "string";
};

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("shortDescription")
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Short description must be between 10 and 300 characters"),
  body("slug")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage(
      "Slug must contain lowercase letters, numbers, and hyphens only",
    ),
  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Short description cannot be more than 300 characters"),
  body("subcategory")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subcategory cannot be more than 100 characters"),
  body("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand cannot be more than 100 characters"),
  body("tags")
    .optional()
    .custom((value) => {
      if (!isArrayOrCommaSeparatedString(value)) {
        throw new Error(
          "Tags must be an array of strings or a comma-separated string",
        );
      }
      return true;
    }),
  body("briefDescriptionPoints").custom((value) => {
    if (!isValidBriefPoints(value)) {
      throw new Error(
        "Brief description points are required, and each point must be 1 to 300 characters",
      );
    }
    return true;
  }),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("costPrice")
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a positive number"),
  body("originalPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Original price must be a positive number"),
  body("salePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be a positive number"),
  body("sku")
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 128 })
    .withMessage("Barcode cannot be more than 128 characters"),
  body("category").custom(async (value) => {
    const category = await Category.findOne({ value, isActive: true });
    if (!category) {
      throw new Error("Invalid category");
    }
    return true;
  }),
  body("productCollection")
    .exists({ checkFalsy: true })
    .withMessage("Product collection is required")
    .trim()
    .isIn(["male", "female", "both"])
    .withMessage('Product collection must be one of "male", "female", or "both"'),
  body("faqContent")
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("FAQ content cannot be more than 10000 characters"),
  body("qualityPromiseContent")
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("Quality promise content cannot be more than 3000 characters"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("thumbnail")
    .optional()
    .isString()
    .withMessage("Thumbnail must be a string"),
  body("videoUrl")
    .optional()
    .isString()
    .withMessage("Video URL must be a string"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("trending")
    .optional()
    .isBoolean()
    .withMessage("Trending must be a boolean"),
  body("bestseller")
    .optional()
    .isBoolean()
    .withMessage("Bestseller must be a boolean"),
  body("newArrival")
    .optional()
    .isBoolean()
    .withMessage("New arrival must be a boolean"),
  body("lenses")
    .optional()
    .isBoolean()
    .withMessage("Lenses must be a boolean"),
  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be either draft or published"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
  body("shipping")
    .optional()
    .isObject()
    .withMessage("Shipping must be an object"),
  body("shipping.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping weight must be a positive number"),
  body("shipping.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping length must be a positive number"),
  body("shipping.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping width must be a positive number"),
  body("shipping.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping height must be a positive number"),
  body("shipping.freeShipping")
    .optional()
    .isBoolean()
    .withMessage("Shipping freeShipping must be a boolean"),
  body("seo").optional().isObject().withMessage("SEO must be an object"),
  body("seo.metaTitle")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("SEO meta title cannot be more than 160 characters"),
  body("seo.metaDescription")
    .optional()
    .trim()
    .isLength({ max: 320 })
    .withMessage("SEO meta description cannot be more than 320 characters"),
  body("seoKeywords")
    .optional()
    .custom((value) => {
      if (!isArrayOrCommaSeparatedString(value)) {
        throw new Error(
          "SEO keywords must be an array of strings or a comma-separated string",
        );
      }
      return true;
    }),
];

const updateProductValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("shortDescription")
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Short description must be between 10 and 300 characters"),
  body("slug")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage(
      "Slug must contain lowercase letters, numbers, and hyphens only",
    ),
  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Short description cannot be more than 300 characters"),
  body("subcategory")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subcategory cannot be more than 100 characters"),
  body("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand cannot be more than 100 characters"),
  body("tags")
    .optional()
    .custom((value) => {
      if (!isArrayOrCommaSeparatedString(value)) {
        throw new Error(
          "Tags must be an array of strings or a comma-separated string",
        );
      }
      return true;
    }),
  body("briefDescriptionPoints")
    .optional()
    .custom((value) => {
      if (!isValidBriefPoints(value)) {
        throw new Error(
          "Brief description points must be a non-empty list and each point must be 1 to 300 characters",
        );
      }
      return true;
    }),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a positive number"),
  body("originalPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Original price must be a positive number"),
  body("salePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be a positive number"),
  body("sku")
    .optional()
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 128 })
    .withMessage("Barcode cannot be more than 128 characters"),
  body("category")
    .optional()
    .custom(async (value) => {
      const category = await Category.findOne({ value, isActive: true });
      if (!category) {
        throw new Error("Invalid category");
      }
      return true;
    }),
  body("productCollection")
    .optional()
    .trim()
    .isIn(["male", "female", "both"])
    .withMessage('Product collection must be one of "male", "female", or "both"'),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("thumbnail")
    .optional()
    .isString()
    .withMessage("Thumbnail must be a string"),
  body("videoUrl")
    .optional()
    .isString()
    .withMessage("Video URL must be a string"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),
  body("trending")
    .optional()
    .isBoolean()
    .withMessage("Trending must be a boolean"),
  body("bestseller")
    .optional()
    .isBoolean()
    .withMessage("Bestseller must be a boolean"),
  body("newArrival")
    .optional()
    .isBoolean()
    .withMessage("New arrival must be a boolean"),
  body("lenses")
    .optional()
    .isBoolean()
    .withMessage("Lenses must be a boolean"),
  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be either draft or published"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
  body("shipping")
    .optional()
    .isObject()
    .withMessage("Shipping must be an object"),
  body("shipping.weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping weight must be a positive number"),
  body("shipping.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping length must be a positive number"),
  body("shipping.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping width must be a positive number"),
  body("shipping.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping height must be a positive number"),
  body("shipping.freeShipping")
    .optional()
    .isBoolean()
    .withMessage("Shipping freeShipping must be a boolean"),
  body("seo").optional().isObject().withMessage("SEO must be an object"),
  body("seo.metaTitle")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("SEO meta title cannot be more than 160 characters"),
  body("seo.metaDescription")
    .optional()
    .trim()
    .isLength({ max: 320 })
    .withMessage("SEO meta description cannot be more than 320 characters"),
  body("seoKeywords")
    .optional()
    .custom((value) => {
      if (!isArrayOrCommaSeparatedString(value)) {
        throw new Error(
          "SEO keywords must be an array of strings or a comma-separated string",
        );
      }
      return true;
    }),
  body("faqContent")
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("FAQ content cannot be more than 10000 characters"),
  body("qualityPromiseContent")
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("Quality promise content cannot be more than 3000 characters"),
];

const reviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Review title must be between 3 and 100 characters"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Comment must be between 10 and 2000 characters"),
  body("displayName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Display name cannot be more than 100 characters"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("media")
    .optional()
    .custom((value) => {
      if (value == null) return true;
      if (typeof value !== "object") {
        throw new Error("Media must be an object");
      }
      if (value.url && typeof value.url !== "string") {
        throw new Error("Media url must be a string");
      }
      if (value.public_id && typeof value.public_id !== "string") {
        throw new Error("Media public id must be a string");
      }
      if (
        value.mediaType &&
        !["image", "video", ""].includes(value.mediaType)
      ) {
        throw new Error("Media type must be image or video");
      }
      return true;
    }),
];

const questionValidation = [
  body("question")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Question must be between 10 and 2000 characters"),
  body("displayName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Display name cannot be more than 100 characters"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

const answerQuestionValidation = [
  body("answer")
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage("Answer must be between 1 and 3000 characters"),
];

// Routes
// Trending products (must be before /:id to avoid conflicts)
router.get("/trending", getTrendingProducts);
router.post("/trending/cache/clear", protect, authorize("admin"), clearCache);

// Product views and interactions
router.post("/:id/view", recordView);
router.post("/:id/add-to-cart", recordCart);
router.post("/:id/sale", protect, authorize("admin"), recordSale);

// Main product routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/slug/:id", optionalProtect, getProduct);
router.get("/:id", optionalProtect, getProduct);
router.post(
  "/",
  protect,
  authorize("admin"),
  createProductValidation,
  createProduct,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateProductValidation,
  updateProduct,
);
router.delete("/:id", protect, authorize("admin"), deleteProduct);
router.post("/:id/reviews", protect, reviewValidation, createProductReview);
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  authorize("admin"),
  deleteProductReview,
);
router.post(
  "/:id/questions",
  protect,
  questionValidation,
  createProductQuestion,
);
router.patch(
  "/:id/questions/:questionId/answer",
  protect,
  authorize("admin"),
  answerQuestionValidation,
  answerProductQuestion,
);
router.delete(
  "/:id/questions/:questionId/answer",
  protect,
  authorize("admin"),
  deleteProductQuestionAnswer,
);
router.delete(
  "/:id/questions/:questionId",
  protect,
  authorize("admin"),
  deleteProductQuestion,
);

export default router;
