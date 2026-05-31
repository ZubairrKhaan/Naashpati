import Batch from "../models/Batch.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getStockTotalsByProductIds = async (productIds, session) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return new Map();
  }

  const normalizedProductIds = productIds
    .map((id) => {
      if (id instanceof mongoose.Types.ObjectId) {
        return id;
      }

      if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }

      if (id?._id && mongoose.Types.ObjectId.isValid(id._id)) {
        return new mongoose.Types.ObjectId(id._id);
      }

      if (id?.toString && mongoose.Types.ObjectId.isValid(id.toString())) {
        return new mongoose.Types.ObjectId(id.toString());
      }

      return null;
    })
    .filter(Boolean);

  if (normalizedProductIds.length === 0) {
    return new Map();
  }

  const aggregate = await Batch.aggregate([
    {
      $match: {
        product_id: { $in: normalizedProductIds },
      },
    },
    {
      $group: {
        _id: "$product_id",
        totalStock: { $sum: "$remaining_quantity" },
      },
    },
  ]).session(session || null);

  const map = new Map();
  for (const row of aggregate) {
    map.set(String(row._id), toNumber(row.totalStock, 0));
  }
  return map;
};

export const attachComputedStock = (products, stockMap) => {
  if (Array.isArray(products)) {
    return products.map((product) => {
      const plain = product?.toObject ? product.toObject() : { ...product };
      plain.stock = stockMap.get(String(plain._id)) || 0;
      return plain;
    });
  }

  if (!products) {
    return products;
  }

  const plain = products?.toObject ? products.toObject() : { ...products };
  plain.stock = stockMap.get(String(plain._id)) || 0;
  return plain;
};

export const syncLegacyProductStock = async (productId, session) => {
  const stockMap = await getStockTotalsByProductIds([productId], session);
  const totalStock = stockMap.get(String(productId)) || 0;

  await Product.findByIdAndUpdate(
    productId,
    { $set: { stock: totalStock } },
    { session, new: false },
  );

  return totalStock;
};

export const createBatchRecord = async (
  { productId, batchNumber, quantity, costPrice, purchaseDate, expiryDate },
  session,
) => {
  const normalizedQuantity = toNumber(quantity, 0);
  const normalizedCostPrice = toNumber(costPrice, 0);

  if (normalizedQuantity < 0) {
    throw new Error("Batch quantity cannot be negative");
  }

  const batch = await Batch.create(
    [
      {
        product_id: productId,
        batch_number: String(batchNumber || "").trim(),
        quantity: normalizedQuantity,
        remaining_quantity: normalizedQuantity,
        cost_price: normalizedCostPrice,
        purchase_date: purchaseDate || new Date(),
        expiry_date: expiryDate || null,
      },
    ],
    { session },
  );

  await syncLegacyProductStock(productId, session);
  return batch[0];
};

export const deductStockFIFO = async (productId, quantity, session) => {
  let quantityToDeduct = toNumber(quantity, 0);

  if (quantityToDeduct <= 0) {
    return [];
  }

  const batches = await Batch.find({
    product_id: productId,
    remaining_quantity: { $gt: 0 },
  })
    .sort({ purchase_date: 1, createdAt: 1, _id: 1 })
    .session(session || null);

  const available = batches.reduce(
    (sum, batch) => sum + toNumber(batch.remaining_quantity, 0),
    0,
  );

  if (available < quantityToDeduct) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  const allocations = [];

  for (const batch of batches) {
    if (quantityToDeduct <= 0) {
      break;
    }

    const remaining = toNumber(batch.remaining_quantity, 0);
    if (remaining <= 0) {
      continue;
    }

    const deducted = Math.min(remaining, quantityToDeduct);
    batch.remaining_quantity = remaining - deducted;

    if (batch.remaining_quantity < 0) {
      throw new Error("NEGATIVE_BATCH_STOCK_NOT_ALLOWED");
    }

    await batch.save({ session });

    allocations.push({
      batchId: batch._id,
      batchNumber: batch.batch_number,
      deducted,
    });

    quantityToDeduct -= deducted;
  }

  await syncLegacyProductStock(productId, session);
  return allocations;
};

export const adjustStockToTarget = async (
  product,
  targetStock,
  { session, costPrice, purchaseDate } = {},
) => {
  const productId = product._id || product;
  const stockMap = await getStockTotalsByProductIds([productId], session);
  const currentTotal = stockMap.get(String(productId)) || 0;
  const normalizedTarget = toNumber(targetStock, 0);

  if (normalizedTarget === currentTotal) {
    return currentTotal;
  }

  if (normalizedTarget > currentTotal) {
    const delta = normalizedTarget - currentTotal;
    await createBatchRecord(
      {
        productId,
        batchNumber: `ADJ-${Date.now()}`,
        quantity: delta,
        costPrice: toNumber(costPrice, product.costPrice || 0),
        purchaseDate: purchaseDate || new Date(),
        expiryDate: null,
      },
      session,
    );
    return normalizedTarget;
  }

  const reduction = currentTotal - normalizedTarget;
  await deductStockFIFO(productId, reduction, session);
  return normalizedTarget;
};
