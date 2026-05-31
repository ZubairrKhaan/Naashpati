const COMPLETED_STATUSES = new Set(["delivered", "completed"]);
const REFUND_OR_CANCEL_STATUSES = new Set(["cancelled", "refunded"]);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const clampNonNegative = (value) => Math.max(0, toNumber(value, 0));

export const computeBestsellerRankingScore = ({
  sales7d = 0,
  sales30d = 0,
  totalSales = 0,
  averageRating = 0,
  refundCount = 0,
} = {}) => {
  const normalizedTotalSales = clampNonNegative(totalSales);
  const normalizedSales7d = clampNonNegative(sales7d);
  const normalizedSales30d = clampNonNegative(sales30d);
  const normalizedRating = clampNonNegative(averageRating);
  const normalizedRefundCount = clampNonNegative(refundCount);

  return (
    normalizedSales7d * 5 +
    normalizedSales30d * 2 +
    Math.log(normalizedTotalSales + 1) +
    normalizedRating * 10 -
    normalizedRefundCount * 3
  );
};

export const isCompletionTransition = (fromStatus = "", toStatus = "") => {
  const from = String(fromStatus || "").toLowerCase();
  const to = String(toStatus || "").toLowerCase();
  return !COMPLETED_STATUSES.has(from) && COMPLETED_STATUSES.has(to);
};

export const isRefundOrCancelTransition = (fromStatus = "", toStatus = "") => {
  const from = String(fromStatus || "").toLowerCase();
  const to = String(toStatus || "").toLowerCase();
  return (
    COMPLETED_STATUSES.has(from) &&
    REFUND_OR_CANCEL_STATUSES.has(to) &&
    !REFUND_OR_CANCEL_STATUSES.has(from)
  );
};

export const buildMetricEventId = ({
  orderId,
  productId,
  eventType,
  toStatus,
}) => {
  return [
    String(orderId),
    String(productId),
    String(eventType),
    String(toStatus),
  ]
    .map((part) => part.trim().toLowerCase())
    .join(":");
};

export const buildMetricDelta = ({ eventType, quantity, amount } = {}) => {
  const qty = clampNonNegative(quantity);
  const money = clampNonNegative(amount);

  if (eventType === "sale") {
    return {
      totalSales: qty,
      sales24h: qty,
      sales7d: qty,
      sales30d: qty,
      revenue: money,
      refundCount: 0,
    };
  }

  if (eventType === "refund") {
    return {
      totalSales: -qty,
      sales24h: -qty,
      sales7d: -qty,
      sales30d: -qty,
      revenue: -money,
      refundCount: qty,
    };
  }

  throw new Error(`Unsupported metric event type: ${eventType}`);
};
