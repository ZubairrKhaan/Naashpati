# Bestseller Pipeline

## Overview

The bestseller system uses precomputed metrics in `product_metrics` and idempotent event records in `product_metric_events`.

### Collections

- `product_metrics`
  - `productId`
  - `totalSales`
  - `sales24h`
  - `sales7d`
  - `sales30d`
  - `revenue`
  - `refundCount`
  - `averageRating`
  - `rankingScore`
- `product_metric_events`
  - `eventId` (unique idempotency key)
  - `orderId`
  - `productId`
  - `type` (`sale` | `refund`)
  - `quantity`
  - `amount`
  - `fromStatus`, `toStatus`
  - `occurredAt`

## Ranking Formula

Used by `computeBestsellerRankingScore`:

```txt
score =
  (sales7d * 5) +
  (sales30d * 2) +
  log(totalSales + 1) +
  (averageRating * 10) -
  (refundCount * 3)
```

## Event Flow

1. Order moves into delivered/completed -> emit `sale` events per item.
2. Delivered/completed order moves into cancelled/refunded -> emit `refund` events per item.
3. Event handler inserts `product_metric_events` with unique `eventId`.
4. Only newly inserted events apply metric deltas (idempotent).
5. Scores are refreshed for touched product IDs.
6. Bestseller cache is invalidated.

## Cache Strategy

- Redis key prefix: `bestsellers:v1:*`
- Key dimensions: `page`, `limit`, `category`
- TTL: `BESTSELLER_CACHE_TTL_SECONDS` (default 300s)
- Invalidation:
  - on metric updates from events
  - on scheduled recompute
  - manual admin endpoint

## API Endpoint

`GET /api/products/trending?page=1&limit=8&category=all&cache=true`

Response:

- paginated
- category filter supported
- only active and in-stock products
- includes `bestseller` metrics DTO per product

## Example Queries

Top products from DB:

```js
db.product_metrics
  .find({}, { productId: 1, rankingScore: 1, sales7d: 1, sales30d: 1 })
  .sort({ rankingScore: -1 })
  .limit(10);
```

Recent metric events:

```js
db.product_metric_events
  .find({
    occurredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  })
  .sort({ occurredAt: -1 });
```
