CREATE TABLE support_tickets (
    id         BIGSERIAL PRIMARY KEY,
    subject    VARCHAR(200) NOT NULL,
    student_id BIGINT       NOT NULL REFERENCES users(id),
    status     VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
