CREATE TABLE fee_structures (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  fee_type VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
  amount NUMERIC(10,2) NOT NULL,
  description VARCHAR(255),
  due_day INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_fee_structures_batch ON fee_structures(batch_id);
