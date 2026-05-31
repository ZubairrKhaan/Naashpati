import {
  buildMetricDelta,
  computeBestsellerRankingScore,
  isCompletionTransition,
  isRefundOrCancelTransition,
} from "../services/bestsellerMetricUtils.js";

describe("bestsellerMetricUtils", () => {
  test("computes ranking score with recent momentum and penalties", () => {
    const score = computeBestsellerRankingScore({
      sales7d: 10,
      sales30d: 20,
      totalSales: 100,
      averageRating: 4.5,
      refundCount: 2,
    });

    expect(score).toBeCloseTo(133.615, 2);
  });

  test("detects completion transition correctly", () => {
    expect(isCompletionTransition("processing", "delivered")).toBe(true);
    expect(isCompletionTransition("delivered", "delivered")).toBe(false);
    expect(isCompletionTransition("cancelled", "pending")).toBe(false);
  });

  test("detects refund/cancel rollback transition only from completed", () => {
    expect(isRefundOrCancelTransition("delivered", "cancelled")).toBe(true);
    expect(isRefundOrCancelTransition("completed", "refunded")).toBe(true);
    expect(isRefundOrCancelTransition("processing", "cancelled")).toBe(false);
  });

  test("builds refund delta with rollback sales and refund count increase", () => {
    const delta = buildMetricDelta({
      eventType: "refund",
      quantity: 3,
      amount: 1200,
    });

    expect(delta).toEqual({
      totalSales: -3,
      sales24h: -3,
      sales7d: -3,
      sales30d: -3,
      revenue: -1200,
      refundCount: 3,
    });
  });
});
