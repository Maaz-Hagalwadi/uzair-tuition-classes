CREATE TABLE class_sessions (
    id               BIGSERIAL PRIMARY KEY,
    batch_id         BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    session_date     DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME,
    meeting_url      VARCHAR(500),
    meeting_platform VARCHAR(50),
    created_by       BIGINT REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
