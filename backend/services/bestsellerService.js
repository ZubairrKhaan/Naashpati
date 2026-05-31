import {
  aggregateRollingSalesFromEvents,
  bulkApplyRollingSales,
  bulkUpdateScores,
  getAllMetrics,
  getMetricsForProductIds,
  getProductRatingsByIds,
  listBestsellersPaginated,
} from "../repositories/productMetricsRepository.js";
import {
  computeBestsellerRankingScore,
  clampNonNegative,
} from "./bestsellerMetricUtils.js";
import {
  getBestsellerCache,
  invalidateBestsellerCache,
  setBestsellerCache,
} from "./bestsellerCacheService.js";

export const getBestsellers = async ({
  page,
  limit,
  category,
  useCache = true,
}) => {
  const cacheParams = { page, limit, category };
  if (useCache) {
    const cached = await getBestsellerCache(cacheParams);
    if (cached) {
      return cached;
    }
  }

  const result = await listBestsellersPaginated({ page, limit, category });

  if (useCache) {
    await setBestsellerCache(cacheParams, result);
  }

  return result;
};

export const refreshScoresForProductIds = async (productIds = []) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return;
  }

  const metrics = await getMetricsForProductIds(productIds);
  if (!metrics.length) {
    return;
  }

  const ratingMap = await getProductRatingsByIds(
    metrics.map((metric) => metric.productId),
  );

  const updates = metrics.map((metric) => {
    const product = ratingMap.get(String(metric.productId));
    const averageRating = clampNonNegative(product?.rating || 0);
    const rankingScore = computeBestsellerRankingScore({
      sales7d: metric.sales7d,
      sales30d: metric.sales30d,
      totalSales: metric.totalSales,
      averageRating,
      refundCount: metric.refundCount,
    });

    return {
      productId: metric.productId,
      averageRating,
      rankingScore,
    };
  });

  await bulkUpdateScores(updates);
};

export const recomputeRollingMetricsAndScores = async () => {
  const rollingRows = await aggregateRollingSalesFromEvents({
    now: new Date(),
  });
  await bulkApplyRollingSales(rollingRows);

  const metrics = await getAllMetrics();
  if (!metrics.length) {
    await invalidateBestsellerCache();
    return;
  }

  const ratingMap = await getProductRatingsByIds(
    metrics.map((metric) => metric.productId),
  );

  const updates = metrics.map((metric) => {
    const product = ratingMap.get(String(metric.productId));
    const averageRating = clampNonNegative(product?.rating || 0);

    return {
      productId: metric.productId,
      averageRating,
      rankingScore: computeBestsellerRankingScore({
        sales7d: metric.sales7d,
        sales30d: metric.sales30d,
        totalSales: metric.totalSales,
        averageRating,
        refundCount: metric.refundCount,
      }),
    };
  });

  await bulkUpdateScores(updates);
  await invalidateBestsellerCache();
};
