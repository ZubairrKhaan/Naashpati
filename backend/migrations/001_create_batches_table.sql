-- SQL reference migration for relational systems.
-- Note: This project currently uses MongoDB; use backend/scripts/migrateStockToInitialBatches.js for data migration.

CREATE TABLE IF NOT EXISTS batches (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(64) NOT NULL,
  quantity NUMERIC(14, 3) NOT NULL CHECK (quantity >= 0),
  remaining_quantity NUMERIC(14, 3) NOT NULL CHECK (remaining_quantity >= 0),
  cost_price NUMERIC(14, 2) NOT NULL CHECK (cost_price >= 0),
  purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_purchase_date ON batches(product_id, purchase_date);

-- Migrate legacy product stock into INITIAL batches
INSERT INTO batches (
  product_id,
  batch_number,
  quantity,
  remaining_quantity,
  cost_price,
  purchase_date,
  expiry_date
)
SELECT
  p.id,
  'INITIAL',
  p.stock,
  p.stock,
  COALESCE(p.cost_price, 0),
  NOW(),
  NULL
FROM products p
WHERE p.stock > 0
  AND NOT EXISTS (
    SELECT 1 FROM batches b WHERE b.product_id = p.id
  );

-- Optional deprecation step (run after application fully relies on batches)
-- ALTER TABLE products DROP COLUMN stock;
