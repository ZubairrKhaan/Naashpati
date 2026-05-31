import Product from "../models/Product.js";
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

export const recordProductView = async (productId) => {
  try {
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
  } catch (error) {
    console.error("[Trending] Error recording product view:", error.message);
  }
};

export const recordAddToCart = async (productId) => {
  try {
    await Product.findByIdAndUpdate(productId, { $inc: { addToCartCount: 1 } });
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

  await applyMetricDelta({
    productId,
    delta: {
      totalSales: qty,
      sales24h: qty,
      sales7d: qty,
      sales30d: qty,
      revenue: qty * price,
      refundCount: 0,
    },
  });

  await refreshScoresForProductIds([productId]);
  await invalidateBestsellerCache();
};

export const clearTrendingCache = async () => {
  await invalidateBestsellerCache();
};
