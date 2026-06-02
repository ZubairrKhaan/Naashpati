import {
  recordProductView,
  recordAddToCart,
  recordProductSale,
} from "../services/trendingProductService.js";
import Product from "../models/Product.js";
import { getBestsellers } from "../services/bestsellerService.js";
import { invalidateBestsellerCache } from "../services/bestsellerCacheService.js";
import { toBestsellerResource } from "../dtos/bestsellerResource.js";

/**
 * @desc    Get trending products
 * @route   GET /api/products/trending
 * @access  Public
 */
export const getTrendingProducts = async (req, res) => {
  try {
    const useCache = req.query.cache !== "false";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 8));
    const category = req.query.category || "all";
    const sortKey = String(req.query.sort || "newest").toLowerCase();
    const skip = (page - 1) * limit;

    const trendingQuery = {
      isActive: true,
      status: "published",
      stock: { $gt: 0 },
      trending: true,
    };

    if (category && category !== "all") {
      trendingQuery.category = category;
    }

    const sortMap = {
      newest: { createdAt: -1 },
      popularity: { trendingScore: -1, createdAt: -1 },
    };
    const sort = sortMap[sortKey] || sortMap.newest;

    const [trendingProducts, totalTrending] = await Promise.all([
      Product.find(trendingQuery).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(trendingQuery),
    ]);

    if (totalTrending > 0) {
      return res.json({
        success: true,
        data: trendingProducts,
        count: trendingProducts.length,
        pagination: {
          page,
          limit,
          total: totalTrending,
          pages: Math.ceil(totalTrending / limit),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await getBestsellers({
      page,
      limit,
      category,
      useCache,
    });

    return res.json({
      success: true,
      data: result.data.map(toBestsellerResource),
      count: result.data.length,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TrendingController] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending products",
    });
  }
};

/**
 * @desc    Record product view
 * @route   POST /api/products/:id/view
 * @access  Public
 */
export const recordView = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    await recordProductView(id);

    res.json({
      success: true,
      message: "View recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording view:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record view",
    });
  }
};

/**
 * @desc    Record add to cart action
 * @route   POST /api/products/:id/add-to-cart
 * @access  Public
 */
export const recordCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    await recordAddToCart(id);

    res.json({
      success: true,
      message: "Add to cart recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording add to cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record add to cart",
    });
  }
};

/**
 * @desc    Record product sale
 * @route   POST /api/products/:id/sale
 * @access  Private/Admin
 */
export const recordSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1, unitPrice = 0 } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be at least 1",
      });
    }

    await recordProductSale(id, quantity, unitPrice);

    res.json({
      success: true,
      message: "Sale recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording sale:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record sale",
    });
  }
};

/**
 * @desc    Clear trending cache
 * @route   POST /api/products/trending/cache/clear
 * @access  Private/Admin
 */
export const clearCache = async (req, res) => {
  try {
    await invalidateBestsellerCache();

    res.json({
      success: true,
      message: "Bestseller cache cleared",
    });
  } catch (error) {
    console.error("[TrendingController] Error clearing cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
};
