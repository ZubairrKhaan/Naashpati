import Product from "../models/Product.js";
import mongoose from "mongoose";
import { applyMetricDelta } from "../repositories/productMetricsRepository.js";
import { invalidateBestsellerCache } from "./bestsellerCacheService.js";
import {
  getBestsellers,
  refreshScoresForProductIds,
} from "./bestsellerService.js";

export const fetchTrendingProducts = async (useCache = true) => {
  const result = await getBestsellers({
    page: 1,
    limit: 8,
    category: "all",
    useCache,
  });
  return result.data;
};

const resolveProductId = async (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  const product = await Product.findOne({ slug: value }).select("_id").lean();
  return product?._id || null;
};

export const recordProductView = async (productId) => {
  try {
    const resolvedProductId = await resolveProductId(productId);
    if (!resolvedProductId) {
      return;
    }

    await Product.findByIdAndUpdate(resolvedProductId, { $inc: { views: 1 } });
  } catch (error) {
    console.error("[Trending] Error recording product view:", error.message);
  }
};

export const recordAddToCart = async (productId) => {
  try {
    const resolvedProductId = await resolveProductId(productId);
    if (!resolvedProductId) {
      return;
    }

    await Product.findByIdAndUpdate(resolvedProductId, {
      $inc: { addToCartCount: 1 },
    });
  } catch (error) {
    console.error("[Trending] Error recording add to cart:", error.message);
  }
};

// Compatibility method for admin/manual sale adjustments.
export const recordProductSale = async (
  productId,
  quantity = 1,
  unitPrice = 0,
) => {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  if (qty <= 0) {
    return;
  }

  const resolvedProductId = await resolveProductId(productId);
  if (!resolvedProductId) {
    return;
  }

  await applyMetricDelta({
    productId: resolvedProductId,
    delta: {
      totalSales: qty,
      sales24h: qty,
      sales7d: qty,
      sales30d: qty,
      revenue: qty * price,
      refundCount: 0,
    },
  });

  await refreshScoresForProductIds([resolvedProductId]);
  await invalidateBestsellerCache();
};

export const clearTrendingCache = async () => {
  await invalidateBestsellerCache();
};
