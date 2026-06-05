CREATE TABLE enrollment_requests (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT NOT NULL REFERENCES users(id),
    batch_id    BIGINT NOT NULL REFERENCES batches(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note        TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, batch_id)
);
