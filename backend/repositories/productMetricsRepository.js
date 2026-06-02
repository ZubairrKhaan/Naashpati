import mongoose from "mongoose";
import Product from "../models/Product.js";
import ProductMetric from "../models/ProductMetric.js";
import ProductMetricEvent from "../models/ProductMetricEvent.js";

const toObjectId = (id) => {
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const applyMetricDelta = async ({ productId, delta, session }) => {
  const normalizedProductId = toObjectId(productId);
  if (!normalizedProductId) {
    throw new Error("Invalid productId for metric update");
  }

  const safeDelta = {
    totalSales: toNumber(delta?.totalSales, 0),
    sales24h: toNumber(delta?.sales24h, 0),
    sales7d: toNumber(delta?.sales7d, 0),
    sales30d: toNumber(delta?.sales30d, 0),
    revenue: toNumber(delta?.revenue, 0),
    refundCount: toNumber(delta?.refundCount, 0),
  };

  await ProductMetric.updateOne(
    { productId: normalizedProductId },
    [
      {
        $set: {
          productId: normalizedProductId,
          totalSales: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$totalSales", 0] }, safeDelta.totalSales] },
            ],
          },
          sales24h: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$sales24h", 0] }, safeDelta.sales24h] },
            ],
          },
          sales7d: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$sales7d", 0] }, safeDelta.sales7d] },
            ],
          },
          sales30d: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$sales30d", 0] }, safeDelta.sales30d] },
            ],
          },
          revenue: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$revenue", 0] }, safeDelta.revenue] },
            ],
          },
          refundCount: {
            $max: [
              0,
              {
                $add: [{ $ifNull: ["$refundCount", 0] }, safeDelta.refundCount],
              },
            ],
          },
          lastAggregatedAt: "$$NOW",
          updatedAt: "$$NOW",
        },
      },
    ],
    {
      upsert: true,
      session,
    },
  );
};

export const listBestsellersPaginated = async ({
  page = 1,
  limit = 8,
  category,
}) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 8));
  const skip = (normalizedPage - 1) * normalizedLimit;

  const productMatch = {
    isActive: true,
    status: "published",
    stock: { $gt: 0 },
  };

  if (category && category !== "all") {
    productMatch.category = category;
  }

  const pipeline = [
    {
      $lookup: {
        from: Product.collection.name,
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    { $match: { product: productMatch } },
    {
      $sort: {
        rankingScore: -1,
        sales7d: -1,
        sales30d: -1,
        totalSales: -1,
        updatedAt: -1,
      },
    },
    {
      $project: {
        _id: "$product._id",
        name: "$product.name",
        price: "$product.price",
        image: "$product.image",
        images: "$product.images",
        category: "$product.category",
        rating: "$product.rating",
        numReviews: "$product.numReviews",
        stock: "$product.stock",
        createdAt: "$product.createdAt",
        bestsellerScore: "$rankingScore",
        totalSales: "$totalSales",
        sales24h: "$sales24h",
        sales7d: "$sales7d",
        sales30d: "$sales30d",
        revenue: "$revenue",
        refundCount: "$refundCount",
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: normalizedLimit }],
        meta: [{ $count: "total" }],
      },
    },
  ];

  const [result] = await ProductMetric.aggregate(pipeline);
  const total = result?.meta?.[0]?.total || 0;

  return {
    data: result?.data || [],
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      pages: Math.ceil(total / normalizedLimit),
    },
  };
};

export const getMetricsForProductIds = async (productIds) => {
  const ids = (productIds || []).map(toObjectId).filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  return ProductMetric.find({ productId: { $in: ids } }).lean();
};

export const bulkUpdateScores = async (updates = []) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    return;
  }

  await ProductMetric.bulkWrite(
    updates.map((item) => ({
      updateOne: {
        filter: { productId: toObjectId(item.productId) },
        update: {
          $set: {
            rankingScore: toNumber(item.rankingScore, 0),
            averageRating: toNumber(item.averageRating, 0),
            lastAggregatedAt: new Date(),
          },
        },
        upsert: false,
      },
    })),
  );
};

export const getProductRatingsByIds = async (productIds = []) => {
  const ids = productIds.map(toObjectId).filter(Boolean);
  if (ids.length === 0) {
    return new Map();
  }

  const products = await Product.find(
    { _id: { $in: ids } },
    { _id: 1, rating: 1, isActive: 1, stock: 1 },
  ).lean();

  const map = new Map();
  for (const product of products) {
    map.set(String(product._id), product);
  }

  return map;
};

export const aggregateRollingSalesFromEvents = async ({
  now = new Date(),
} = {}) => {
  const nowDate = new Date(now);
  const since30d = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7d = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);

  const rows = await ProductMetricEvent.aggregate([
    {
      $match: {
        occurredAt: { $gte: since30d },
      },
    },
    {
      $project: {
        productId: 1,
        quantitySigned: {
          $cond: [
            { $eq: ["$type", "sale"] },
            "$quantity",
            { $multiply: ["$quantity", -1] },
          ],
        },
        occurredAt: 1,
      },
    },
    {
      $group: {
        _id: "$productId",
        sales24h: {
          $sum: {
            $cond: [{ $gte: ["$occurredAt", since24h] }, "$quantitySigned", 0],
          },
        },
        sales7d: {
          $sum: {
            $cond: [{ $gte: ["$occurredAt", since7d] }, "$quantitySigned", 0],
          },
        },
        sales30d: { $sum: "$quantitySigned" },
      },
    },
  ]);

  return rows;
};

export const bulkApplyRollingSales = async (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  await ProductMetric.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { productId: row._id },
        update: {
          $set: {
            sales24h: Math.max(0, toNumber(row.sales24h, 0)),
            sales7d: Math.max(0, toNumber(row.sales7d, 0)),
            sales30d: Math.max(0, toNumber(row.sales30d, 0)),
            lastAggregatedAt: new Date(),
          },
        },
      },
    })),
  );
};

export const getAllMetrics = async () => {
  return ProductMetric.find(
    {},
    {
      productId: 1,
      totalSales: 1,
      sales24h: 1,
      sales7d: 1,
      sales30d: 1,
      revenue: 1,
      refundCount: 1,
    },
  ).lean();
};
