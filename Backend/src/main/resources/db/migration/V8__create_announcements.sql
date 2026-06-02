CREATE TABLE announcements (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    published_by BIGINT REFERENCES users(id),
    batch_id     BIGINT REFERENCES batches(id),
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);
