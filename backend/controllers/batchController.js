import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Product from "../models/Product.js";
import {
  createBatchRecord,
  getStockTotalsByProductIds,
} from "../services/inventoryService.js";

// @desc    Get batches by product
// @route   GET /api/batches/product/:productId
// @access  Private/Admin
export const getBatchesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const batches = await Batch.find({ product_id: productId }).sort({
      purchase_date: 1,
      createdAt: 1,
    });

    const totals = await getStockTotalsByProductIds([productId]);

    res.json({
      success: true,
      data: {
        productId,
        totalStock: totals.get(String(productId)) || 0,
        batches,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create new stock batch
// @route   POST /api/batches
// @access  Private/Admin
export const createBatch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const {
      productId,
      batchNumber,
      quantity,
      costPrice,
      purchaseDate,
      expiryDate,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const batch = await createBatchRecord({
      productId,
      batchNumber,
      quantity,
      costPrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });

    const totals = await getStockTotalsByProductIds([productId]);

    res.status(201).json({
      success: true,
      data: {
        batch,
        totalStock: totals.get(String(productId)) || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error?.message || "Server error",
    });
  }
};
