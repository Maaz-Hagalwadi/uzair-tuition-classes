CREATE TABLE payments (
    id           BIGSERIAL PRIMARY KEY,
    student_id   BIGINT NOT NULL REFERENCES users(id),
    batch_id     BIGINT NOT NULL REFERENCES batches(id),
    amount       DECIMAL(10,2) NOT NULL,
    status       VARCHAR(50) DEFAULT 'PENDING',
    payment_date DATE,
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);
