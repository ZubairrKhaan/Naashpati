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
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const getWordCount = (value = "") =>
  String(value).trim().split(/\s+/).filter(Boolean).length;

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

const isValidIngredients = (value) => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const name = String(item.name || "").trim();
    const amount = String(item.amount || "").trim();

    if (!name && !amount) {
      return true;
    }

    return name.length > 0 && name.length <= 150 && amount.length <= 100;
  });
};

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .custom((value) => {
      if (getWordCount(value) > 50) {
        throw new Error(
          "Description for product listing must be 50 words or fewer",
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
  body("sku")
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("category").custom(async (value) => {
    const category = await Category.findOne({ value, isActive: true });
    if (!category) {
      throw new Error("Invalid category");
    }
    return true;
  }),
  body("helpsTo")
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage("Helps to content cannot be more than 600 characters"),
  body("directions")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value))
          throw new Error("Directions must be an array");
        if (value.some((s) => typeof s !== "string" || s.length > 300))
          throw new Error(
            "Each direction step must be a string up to 300 characters",
          );
      }
      return true;
    }),
  body("servingSize")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Serving size cannot be more than 200 characters"),
  body("instructionsContent")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Instructions content cannot be more than 2000 characters"),
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
  body("ingredients")
    .optional()
    .custom((value) => {
      if (!isValidIngredients(value)) {
        throw new Error(
          "Ingredients must be a list of rows with name (required when row is filled) and optional amount",
        );
      }
      return true;
    }),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

const updateProductValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .custom((value) => {
      if (getWordCount(value) > 50) {
        throw new Error(
          "Description for product listing must be 50 words or fewer",
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
  body("sku")
    .optional()
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("category")
    .optional()
    .custom(async (value) => {
      const category = await Category.findOne({ value, isActive: true });
      if (!category) {
        throw new Error("Invalid category");
      }
      return true;
    }),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("helpsTo")
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage("Helps to content cannot be more than 600 characters"),
  body("directions")
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value))
          throw new Error("Directions must be an array");
        if (value.some((s) => typeof s !== "string" || s.length > 300))
          throw new Error(
            "Each direction step must be a string up to 300 characters",
          );
      }
      return true;
    }),
  body("servingSize")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Serving size cannot be more than 200 characters"),
  body("instructionsContent")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Instructions content cannot be more than 2000 characters"),
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
  body("ingredients")
    .optional()
    .custom((value) => {
      if (!isValidIngredients(value)) {
        throw new Error(
          "Ingredients must be a list of rows with name (required when row is filled) and optional amount",
        );
      }
      return true;
    }),
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
router.get("/:id", getProduct);
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
