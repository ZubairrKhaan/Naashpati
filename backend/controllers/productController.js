import { validationResult } from "express-validator";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import {
  adjustStockToTarget,
  attachComputedStock,
  createBatchRecord,
  getStockTotalsByProductIds,
} from "../services/inventoryService.js";

const normalizeSku = (value = "") => String(value).trim().toUpperCase();

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isSkuDuplicate = async (sku, excludeProductId = null) => {
  if (!sku) return false;

  const query = {
    sku: {
      $regex: new RegExp(`^${escapeRegex(sku)}$`, "i"),
    },
  };

  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }

  const existingProduct = await Product.findOne(query).select("_id").lean();
  return Boolean(existingProduct);
};

const deleteUploadedMediaFile = (url = "") => {
  if (!url.startsWith("/uploads/")) {
    return;
  }

  const filePath = path.join("uploads", path.basename(url));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Search
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    // Category filter
    if (req.query.category && req.query.category !== "all") {
      query.category = req.query.category;
    }

    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Sort
    let sort = {};
    switch (req.query.sort) {
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const stockMap = await getStockTotalsByProductIds(
      products.map((product) => product._id),
    );
    const productsWithStock = attachComputedStock(products, stockMap);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: productsWithStock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const stockMap = await getStockTotalsByProductIds([product._id]);
    const productWithStock = attachComputedStock(product, stockMap);

    res.json({
      success: true,
      data: productWithStock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  console.log("Create product request body:", req.body);
  console.log("User from token:", req.user);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const session = await mongoose.startSession();
    let createdProduct;

    const payload = {
      ...req.body,
      sku: normalizeSku(req.body.sku),
      stock: Number(req.body.stock || 0),
    };

    if (await isSkuDuplicate(payload.sku)) {
      return res.status(409).json({
        success: false,
        error: "SKU already exists. Please use a unique SKU.",
      });
    }

    await session.withTransaction(async () => {
      const product = await Product.create([payload], { session });
      createdProduct = product[0];

      if (payload.stock > 0) {
        await createBatchRecord(
          {
            productId: createdProduct._id,
            batchNumber: "INITIAL",
            quantity: payload.stock,
            costPrice: payload.costPrice,
            purchaseDate: new Date(),
            expiryDate: null,
          },
          session,
        );
      }
    });

    session.endSession();

    const stockMap = await getStockTotalsByProductIds([createdProduct._id]);
    const productWithStock = attachComputedStock(createdProduct, stockMap);

    res.status(201).json({
      success: true,
      data: productWithStock,
    });
  } catch (error) {
    if (error?.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock to apply requested stock change",
      });
    }

    if (error?.message === "NEGATIVE_BATCH_STOCK_NOT_ALLOWED") {
      return res.status(400).json({
        success: false,
        error: "Invalid stock operation",
      });
    }

    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return res.status(400).json({
        success: false,
        error: "SKU already exists. Please use a unique SKU.",
      });
    }

    console.error("Product creation error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const payload = {
      ...req.body,
    };

    if (typeof req.body.sku === "string") {
      payload.sku = normalizeSku(req.body.sku);

      if (await isSkuDuplicate(payload.sku, req.params.id)) {
        return res.status(409).json({
          success: false,
          error: "SKU already exists. Please use a unique SKU.",
        });
      }
    }

    const session = await mongoose.startSession();
    let updatedProduct;

    await session.withTransaction(async () => {
      if (payload.stock !== undefined) {
        await adjustStockToTarget(product, Number(payload.stock), {
          session,
          costPrice:
            payload.costPrice !== undefined
              ? Number(payload.costPrice)
              : Number(product.costPrice || 0),
          purchaseDate: new Date(),
        });
      }

      delete payload.stock;

      updatedProduct = await Product.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
        session,
      });
    });

    session.endSession();

    const stockMap = await getStockTotalsByProductIds([updatedProduct._id]);
    const productWithStock = attachComputedStock(updatedProduct, stockMap);

    res.json({
      success: true,
      data: productWithStock,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return res.status(400).json({
        success: false,
        error: "SKU already exists. Please use a unique SKU.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: "Product removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const { rating, comment, title, displayName, email, media } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: "Product already reviewed",
      });
    }

    const review = {
      user: req.user._id,
      rating: Number(rating),
      title: String(title || "").trim(),
      comment,
      displayName: String(displayName || req.user?.name || "").trim(),
      email: String(email || req.user?.email || "")
        .trim()
        .toLowerCase(),
      media:
        media && typeof media === "object"
          ? {
              url: String(media.url || ""),
              public_id: String(media.public_id || ""),
              mediaType: String(media.mediaType || ""),
            }
          : undefined,
    };

    product.reviews.push(review);
    product.calculateAverageRating();

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};

// @desc    Create product question
// @route   POST /api/products/:id/questions
// @access  Private
export const createProductQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const { title, question, displayName, email } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    product.questions.push({
      user: req.user._id,
      title: String(title || "").trim(),
      question: String(question || "").trim(),
      displayName: String(displayName || req.user?.name || "").trim(),
      email: String(email || req.user?.email || "")
        .trim()
        .toLowerCase(),
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Question added",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Answer product question
// @route   PATCH /api/products/:id/questions/:questionId/answer
// @access  Private/Admin
export const answerProductQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.questionId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const question = product.questions.id(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    question.answer = String(req.body.answer || "").trim();
    question.isAnswered = true;

    await product.save();

    res.json({
      success: true,
      message: "Question answered",
      data: { question },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete product question answer
// @route   DELETE /api/products/:id/questions/:questionId/answer
// @access  Private/Admin
export const deleteProductQuestionAnswer = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.questionId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const question = product.questions.id(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    question.answer = "";
    question.isAnswered = false;

    await product.save();

    res.json({
      success: true,
      message: "Question answer deleted",
      data: { question },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
export const deleteProductReview = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.reviewId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    const mediaUrl = review.media?.url || "";
    review.deleteOne();
    product.calculateAverageRating();
    await product.save();
    deleteUploadedMediaFile(mediaUrl);

    res.json({
      success: true,
      message: "Review deleted",
      data: { reviewId: req.params.reviewId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete product question
// @route   DELETE /api/products/:id/questions/:questionId
// @access  Private/Admin
export const deleteProductQuestion = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.questionId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid id",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const question = product.questions.id(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    question.deleteOne();
    await product.save();

    res.json({
      success: true,
      message: "Question deleted",
      data: { questionId: req.params.questionId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select("name value description");

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
