/**
 * Trending Metrics Tracker
 * Utility to record user interactions for trending products algorithm
 */

import api from "../api/axios";

/**
 * Record that a product was viewed
 * Call this when user opens product detail page
 */
export const trackProductView = async (productId) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for view");
      return;
    }
    await api.post(`/products/${productId}/view`);
    console.log("[Tracking] Product view recorded:", productId);
  } catch (error) {
    console.warn("[Tracking] Error recording view:", error.message);
  }
};

/**
 * Record that a product was added to cart
 * Call this when user clicks "Add to Cart"
 */
export const trackAddToCart = async (productId) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for add to cart");
      return;
    }
    await api.post(`/products/${productId}/add-to-cart`);
    console.log("[Tracking] Add to cart recorded:", productId);
  } catch (error) {
    console.warn("[Tracking] Error recording add to cart:", error.message);
  }
};

/**
 * Record a product sale
 * Call this when order is successfully placed
 * Requires authentication
 */
export const trackProductSale = async (
  productId,
  quantity = 1,
  token = null,
) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for sale");
      return;
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await api.post(
      `/products/${productId}/sale`,
      { quantity: Math.max(1, quantity) },
      { headers },
    );
    console.log(
      "[Tracking] Product sale recorded:",
      productId,
      "qty:",
      quantity,
    );
  } catch (error) {
    console.warn("[Tracking] Error recording sale:", error.message);
  }
};

/**
 * Fetch trending products
 * Usually handled by Redux, but available as standalone utility too
 */
export const fetchTrendingProducts = async (bypassCache = false) => {
  try {
    const cacheParam = bypassCache ? "?cache=false" : "";
    const response = await api.get(`/products/trending${cacheParam}`);
    return response.data.data || [];
  } catch (error) {
    console.error("[Tracking] Error fetching trending products:", error);
    return [];
  }
};

/**
 * Clear trending cache (admin only)
 */
export const clearTrendingCache = async (token) => {
  try {
    if (!token) {
      console.warn("[Tracking] No auth token provided for cache clear");
      return false;
    }
    const response = await api.post(
      "/products/trending/cache/clear",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log("[Tracking] Trending cache cleared");
    return response.status === 200;
  } catch (error) {
    console.warn("[Tracking] Error clearing cache:", error.message);
    return false;
  }
};

export default {
  trackProductView,
  trackAddToCart,
  trackProductSale,
  fetchTrendingProducts,
  clearTrendingCache,
};
