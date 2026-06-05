CREATE TABLE attendance (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'ABSENT',
    marked_by  BIGINT REFERENCES users(id),
    marked_at  TIMESTAMP DEFAULT NOW(),
    notes      TEXT,
    UNIQUE (session_id, student_id)
);
