import mongoose from "mongoose";
import ProductMetricEvent from "../models/ProductMetricEvent.js";
import { applyMetricDelta } from "../repositories/productMetricsRepository.js";
import {
  buildMetricDelta,
  buildMetricEventId,
} from "../services/bestsellerMetricUtils.js";
import { invalidateBestsellerCache } from "../services/bestsellerCacheService.js";
import { refreshScoresForProductIds } from "../services/bestsellerService.js";

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

const buildEventsFromOrderItems = ({
  order,
  eventType,
  fromStatus,
  toStatus,
  occurredAt,
}) => {
  return (order?.orderItems || []).map((item) => {
    const productId = toObjectId(item.product?._id || item.product);
    const quantity = Number(item.quantity) || 0;
    const amount = (Number(item.price) || 0) * quantity;

    return {
      eventId: buildMetricEventId({
        orderId: order._id,
        productId,
        eventType,
        toStatus,
      }),
      orderId: order._id,
      productId,
      type: eventType,
      quantity,
      amount,
      fromStatus: fromStatus || "",
      toStatus: toStatus || "",
      occurredAt: occurredAt || new Date(),
    };
  });
};

export const processOrderMetricEvents = async ({
  order,
  eventType,
  fromStatus,
  toStatus,
  occurredAt,
}) => {
  if (!order?._id || !eventType) {
    return;
  }

  const events = buildEventsFromOrderItems({
    order,
    eventType,
    fromStatus,
    toStatus,
    occurredAt,
  }).filter((event) => event.productId && event.quantity > 0);

  if (events.length === 0) {
    return;
  }

  const session = await mongoose.startSession();
  const touchedProductIds = new Set();

  try {
    await session.withTransaction(async () => {
      for (const event of events) {
        const insertResult = await ProductMetricEvent.updateOne(
          { eventId: event.eventId },
          { $setOnInsert: event },
          { upsert: true, session },
        );

        // Idempotency: only apply deltas if the event was inserted now.
        if (!insertResult.upsertedCount) {
          continue;
        }

        const delta = buildMetricDelta({
          eventType: event.type,
          quantity: event.quantity,
          amount: event.amount,
        });

        await applyMetricDelta({
          productId: event.productId,
          delta,
          session,
        });

        touchedProductIds.add(String(event.productId));
      }
    });
  } finally {
    session.endSession();
  }

  if (touchedProductIds.size > 0) {
    await refreshScoresForProductIds([...touchedProductIds]);
    await invalidateBestsellerCache();
  }
};
