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
const normalizeBarcode = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw;
};

const toSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);

const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj || {}, key);

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
};

const isLensProductValue = (value) => normalizeBoolean(value, false);

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAttributes = (value = {}) => ({
  color: String(value?.color || "").trim(),
  material: String(value?.material || "").trim(),
  size: String(value?.size || "").trim(),
  lensType: String(value?.lensType || "").trim(),
  uvProtection: String(value?.uvProtection || "").trim(),
  frameMaterial: String(value?.frameMaterial || "").trim(),
  author: String(value?.author || "").trim(),
  pages:
    value?.pages === null || value?.pages === undefined || value?.pages === ""
      ? null
      : Math.max(0, normalizeNumber(value.pages, 0)),
  language: String(value?.language || "").trim(),
  bottleCapacity: String(value?.bottleCapacity || "").trim(),
  dimensions: String(value?.dimensions || "").trim(),
});

const normalizeShipping = (value = {}) => ({
  weight: Math.max(0, normalizeNumber(value?.weight, 0)),
  length: Math.max(0, normalizeNumber(value?.length, 0)),
  width: Math.max(0, normalizeNumber(value?.width, 0)),
  height: Math.max(0, normalizeNumber(value?.height, 0)),
  freeShipping: normalizeBoolean(value?.freeShipping, false),
});

const normalizeSeo = (seo = {}, seoKeywordsInput) => ({
  metaTitle: String(seo?.metaTitle || "").trim(),
  metaDescription: String(seo?.metaDescription || "").trim(),
  seoKeywords: normalizeStringArray(
    seoKeywordsInput !== undefined ? seoKeywordsInput : seo?.seoKeywords,
  ),
});

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

const isBarcodeDuplicate = async (barcode, excludeProductId = null) => {
  const normalized = String(barcode || "").trim();
  if (!normalized) return false;

  const query = { barcode: normalized };
  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }

  const existingProduct = await Product.findOne(query).select("_id").lean();
  return Boolean(existingProduct);
};

const generateUniqueSlug = async (seedValue, excludeProductId = null) => {
  const baseSlug = toSlug(seedValue);
  if (!baseSlug) {
    return "";
  }

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate =
      suffix === 0
        ? baseSlug
        : `${baseSlug.slice(0, Math.max(1, 155 - String(suffix).length))}-${suffix}`;

    const query = { slug: candidate };
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }

    const exists = await Product.findOne(query).select("_id").lean();
    if (!exists) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString().slice(-6)}`;
};

const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("transaction numbers are only allowed") ||
    message.includes("replica set") ||
    message.includes("transaction")
  );
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
    const query = { isActive: true };

    if (req.query.includeDraft !== "true") {
      query.status = { $ne: "draft" };
    }

    if (req.query.status && ["draft", "published"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    // Search
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    // Category filter
    if (req.query.category && req.query.category !== "all") {
      query.category = req.query.category;
    }

    const requestedCollection = String(
      req.query["gender-category"] || req.query.collection || "",
    )
      .trim()
      .toLowerCase();

    if (requestedCollection) {
      const normalizedCollection =
        requestedCollection === "male-collection"
          ? "male"
          : requestedCollection === "female-collection"
            ? "female"
            : requestedCollection;

      if (normalizedCollection === "male") {
        query.$or = [
          { productCollection: { $in: ["male", "both"] } },
          { collection: { $in: ["male", "both"] } },
        ];
      } else if (normalizedCollection === "female") {
        query.$or = [
          { productCollection: { $in: ["female", "both"] } },
          { collection: { $in: ["female", "both"] } },
        ];
      } else if (normalizedCollection === "both") {
        query.$or = [
          { productCollection: "both" },
          { collection: "both" },
        ];
      }
    }

    if (req.query.newArrival === "true") {
      query.newArrival = true;
    }

    if (req.query.lenses === "true") {
      query.lenses = true;
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
    const identifier = String(req.params.id || "").trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const product = isObjectId
      ? await Product.findById(identifier)
      : await Product.findOne({ slug: identifier.toLowerCase() });

    const canViewDraft = req.user?.role === "admin";
    if (
      !product ||
      !product.isActive ||
      (product.status === "draft" && !canViewDraft)
    ) {
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
    let createdProduct;

    const incomingBody = req.body || {};

    // Debug: log incoming collection value for create requests
    console.log(
      "createProduct - incomingBody.productCollection =>",
      incomingBody.productCollection || incomingBody.collection,
    );

    const payload = {
      ...incomingBody,
      sku: normalizeSku(req.body.sku),
      stock: normalizeNumber(req.body.stock || 0, 0),
      shortDescription: String(incomingBody.shortDescription || "")
        .trim()
        .slice(0, 300),
      subcategory: String(incomingBody.subcategory || "").trim(),
      brand: String(incomingBody.brand || "").trim(),
      tags: normalizeStringArray(incomingBody.tags),
      price: normalizeNumber(incomingBody.price ?? incomingBody.salePrice, 0),
      salePrice: normalizeNumber(
        incomingBody.salePrice ?? incomingBody.price,
        0,
      ),
      originalPrice: normalizeNumber(
        incomingBody.originalPrice ?? incomingBody.price,
        0,
      ),
      barcode: normalizeBarcode(incomingBody.barcode),
      thumbnail: String(
        incomingBody.thumbnail || incomingBody.image || "",
      ).trim(),
      image: String(incomingBody.image || incomingBody.thumbnail || "").trim(),
      videoUrl: String(incomingBody.videoUrl || "").trim(),
      featured: normalizeBoolean(incomingBody.featured, false),
      trending: normalizeBoolean(incomingBody.trending, false),
      bestseller: normalizeBoolean(incomingBody.bestseller, false),
      newArrival: normalizeBoolean(incomingBody.newArrival, false),
      lenses: normalizeBoolean(incomingBody.lenses, false),
      status: ["draft", "published"].includes(incomingBody.status)
        ? incomingBody.status
        : "published",
      attributes: normalizeAttributes(incomingBody.attributes),
      shipping: normalizeShipping(incomingBody.shipping),
      seo: normalizeSeo(incomingBody.seo, incomingBody.seoKeywords),
    };

    const normalizedProductCollection = hasOwn(incomingBody, "productCollection")
      ? String(incomingBody.productCollection || "").trim().toLowerCase()
      : hasOwn(incomingBody, "collection")
      ? String(incomingBody.collection || "").trim().toLowerCase()
      : undefined;

    if (normalizedProductCollection) {
      payload.productCollection = normalizedProductCollection;
    }

    if (isLensProductValue(payload.lenses)) {
      payload.category = "";
      payload.productCollection = "";
      payload.subcategory = "";
    }

    if (!hasOwn(incomingBody, "isActive")) {
      payload.isActive = payload.status === "published";
    }

    payload.slug = await generateUniqueSlug(
      incomingBody.slug || incomingBody.name,
    );

    const normalizedPayload = payload;

    // Debug: log normalized payload productCollection before create
    console.log(
      "createProduct - normalizedPayload.productCollection =>",
      normalizedPayload.productCollection,
    );

    if (await isSkuDuplicate(normalizedPayload.sku)) {
      return res.status(409).json({
        success: false,
        error: "SKU already exists. Please use a unique SKU.",
      });
    }

    if (await isBarcodeDuplicate(normalizedPayload.barcode)) {
      return res.status(409).json({
        success: false,
        error: "Barcode already exists. Please use a unique barcode.",
      });
    }

    const createWithSession = async () => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const product = await Product.create([normalizedPayload], {
            session,
          });
          createdProduct = product[0];

          if (normalizedPayload.stock > 0) {
            await createBatchRecord(
              {
                productId: createdProduct._id,
                batchNumber: "INITIAL",
                quantity: normalizedPayload.stock,
                costPrice: normalizedPayload.costPrice,
                purchaseDate: new Date(),
                expiryDate: null,
              },
              session,
            );
          }
        });
      } finally {
        await session.endSession();
      }
    };

    try {
      await createWithSession();
    } catch (txError) {
      if (!isTransactionUnsupportedError(txError)) {
        throw txError;
      }

      // Local standalone MongoDB does not support transactions.
      createdProduct = await Product.create(normalizedPayload);
      if (normalizedPayload.stock > 0) {
        await createBatchRecord({
          productId: createdProduct._id,
          batchNumber: "INITIAL",
          quantity: normalizedPayload.stock,
          costPrice: normalizedPayload.costPrice,
          purchaseDate: new Date(),
          expiryDate: null,
        });
      }
    }

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

    if (error?.code === 11000 && error?.keyPattern?.barcode) {
      return res.status(400).json({
        success: false,
        error: "Barcode already exists. Please use a unique barcode.",
      });
    }

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(400).json({
        success: false,
        error: "Slug already exists. Please use a unique slug.",
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

    const incomingBody = req.body || {};

    const payload = {
      ...incomingBody,
    };

    if (hasOwn(incomingBody, "sku")) {
      payload.sku = normalizeSku(incomingBody.sku);
    }

    if (hasOwn(incomingBody, "price") || hasOwn(incomingBody, "salePrice")) {
      const priceValue = hasOwn(incomingBody, "price")
        ? incomingBody.price
        : incomingBody.salePrice;
      const salePriceValue = hasOwn(incomingBody, "salePrice")
        ? incomingBody.salePrice
        : incomingBody.price;

      payload.price = normalizeNumber(priceValue, Number(product.price || 0));
      payload.salePrice = normalizeNumber(
        salePriceValue,
        Number(product.salePrice || product.price || 0),
      );
    }

    if (hasOwn(incomingBody, "originalPrice")) {
      payload.originalPrice = normalizeNumber(
        incomingBody.originalPrice,
        Number(product.originalPrice || product.price || 0),
      );
    }

    if (hasOwn(incomingBody, "shortDescription")) {
      payload.shortDescription = String(incomingBody.shortDescription || "")
        .trim()
        .slice(0, 300);
    }

    if (hasOwn(incomingBody, "subcategory")) {
      payload.subcategory = String(incomingBody.subcategory || "").trim();
    }

    if (hasOwn(incomingBody, "brand")) {
      payload.brand = String(incomingBody.brand || "").trim();
    }

    if (hasOwn(incomingBody, "tags")) {
      payload.tags = normalizeStringArray(incomingBody.tags);
    }

    if (hasOwn(incomingBody, "barcode")) {
      payload.barcode = normalizeBarcode(incomingBody.barcode);
    }

    if (hasOwn(incomingBody, "thumbnail") || hasOwn(incomingBody, "image")) {
      payload.thumbnail = String(
        incomingBody.thumbnail ?? incomingBody.image ?? product.thumbnail ?? "",
      ).trim();
      payload.image = String(
        incomingBody.image ?? incomingBody.thumbnail ?? product.image ?? "",
      ).trim();
    }

    if (hasOwn(incomingBody, "videoUrl")) {
      payload.videoUrl = String(incomingBody.videoUrl || "").trim();
    }

    if (hasOwn(incomingBody, "featured")) {
      payload.featured = normalizeBoolean(incomingBody.featured, false);
    }

    if (hasOwn(incomingBody, "trending")) {
      payload.trending = normalizeBoolean(incomingBody.trending, false);
    }

    if (hasOwn(incomingBody, "bestseller")) {
      payload.bestseller = normalizeBoolean(incomingBody.bestseller, false);
    }

    if (hasOwn(incomingBody, "newArrival")) {
      payload.newArrival = normalizeBoolean(incomingBody.newArrival, false);
    }

    if (hasOwn(incomingBody, "lenses")) {
      payload.lenses = normalizeBoolean(incomingBody.lenses, false);
    }

    if (hasOwn(incomingBody, "status")) {
      payload.status = ["draft", "published"].includes(incomingBody.status)
        ? incomingBody.status
        : product.status || "published";
      if (!hasOwn(incomingBody, "isActive")) {
        payload.isActive = payload.status === "published";
      }
    }

    if (hasOwn(incomingBody, "attributes")) {
      payload.attributes = normalizeAttributes(incomingBody.attributes);
    }

    const normalizedProductCollection = hasOwn(incomingBody, "productCollection")
      ? String(incomingBody.productCollection || "").trim().toLowerCase()
      : hasOwn(incomingBody, "collection")
      ? String(incomingBody.collection || "").trim().toLowerCase()
      : undefined;

    if (normalizedProductCollection) {
      payload.productCollection = normalizedProductCollection;
    }

    const nextIsLensProduct = hasOwn(payload, "lenses")
      ? isLensProductValue(payload.lenses)
      : isLensProductValue(product.lenses);

    if (nextIsLensProduct) {
      payload.lenses = true;
      payload.category = "";
      payload.productCollection = "";
      payload.subcategory = "";
    }

    if (hasOwn(incomingBody, "shipping")) {
      payload.shipping = normalizeShipping(incomingBody.shipping);
    }

    if (hasOwn(incomingBody, "seo") || hasOwn(incomingBody, "seoKeywords")) {
      payload.seo = normalizeSeo(incomingBody.seo, incomingBody.seoKeywords);
    }

    if (hasOwn(incomingBody, "stock")) {
      payload.stock = normalizeNumber(
        incomingBody.stock,
        Number(product.stock || 0),
      );
    }

    if (hasOwn(incomingBody, "slug") || hasOwn(incomingBody, "name")) {
      payload.slug = await generateUniqueSlug(
        incomingBody.slug || incomingBody.name || product.name,
        product._id,
      );
    }

    const normalizedPayload = payload;

    if (typeof normalizedPayload.sku === "string") {
      if (await isSkuDuplicate(normalizedPayload.sku, req.params.id)) {
        return res.status(409).json({
          success: false,
          error: "SKU already exists. Please use a unique SKU.",
        });
      }
    }

    if (typeof normalizedPayload.barcode === "string") {
      if (await isBarcodeDuplicate(normalizedPayload.barcode, req.params.id)) {
        return res.status(409).json({
          success: false,
          error: "Barcode already exists. Please use a unique barcode.",
        });
      }
    }

    let updatedProduct;
    const shouldRunUpdateValidators = !nextIsLensProduct;

    const updateWithSession = async () => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          if (normalizedPayload.stock !== undefined) {
            await adjustStockToTarget(product, Number(payload.stock), {
              session,
              costPrice:
                normalizedPayload.costPrice !== undefined
                  ? Number(normalizedPayload.costPrice)
                  : Number(product.costPrice || 0),
              purchaseDate: new Date(),
            });
          }

          delete normalizedPayload.stock;

          updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            normalizedPayload,
            {
              new: true,
              runValidators: shouldRunUpdateValidators,
              session,
            },
          );
        });
      } finally {
        await session.endSession();
      }
    };

    try {
      await updateWithSession();
    } catch (txError) {
      if (!isTransactionUnsupportedError(txError)) {
        throw txError;
      }

      if (normalizedPayload.stock !== undefined) {
        await adjustStockToTarget(product, Number(payload.stock), {
          costPrice:
            normalizedPayload.costPrice !== undefined
              ? Number(normalizedPayload.costPrice)
              : Number(product.costPrice || 0),
          purchaseDate: new Date(),
        });
      }

      delete normalizedPayload.stock;

      updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        normalizedPayload,
        {
          new: true,
          runValidators: shouldRunUpdateValidators,
        },
      );
    }

    // Debug: log updated product collection after DB update
    console.log(
      "updateProduct - updatedProduct.productCollection =>",
      updatedProduct?.productCollection,
    );

    // If productCollection was provided in the incoming payload, enforce it on the
    // returned document and save so schema setters (eg. lowercase) run and
    // the value is guaranteed persisted.
    if (
      hasOwn(normalizedPayload, "productCollection") &&
      updatedProduct &&
      !nextIsLensProduct
    ) {
      try {
        const desired = String(normalizedPayload.productCollection || "")
          .trim()
          .toLowerCase();
        if (updatedProduct.productCollection !== desired) {
          updatedProduct.productCollection = desired;
          await updatedProduct.save();
          console.log(
            "updateProduct - enforced saved productCollection =>",
            updatedProduct.productCollection,
          );
        }
      } catch (saveErr) {
        console.error("Error enforcing productCollection save:", saveErr);
      }
    }

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

    if (error?.code === 11000 && error?.keyPattern?.barcode) {
      return res.status(400).json({
        success: false,
        error: "Barcode already exists. Please use a unique barcode.",
      });
    }

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(400).json({
        success: false,
        error: "Slug already exists. Please use a unique slug.",
      });
    }

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

    console.error("Product update error:", error);
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
      .select("name value description image");

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
