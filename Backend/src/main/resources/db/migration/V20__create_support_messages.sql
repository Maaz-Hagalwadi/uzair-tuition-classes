CREATE TABLE support_messages (
    id        BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT    NOT NULL REFERENCES support_tickets(id),
    sender_id BIGINT    NOT NULL REFERENCES users(id),
    message   TEXT      NOT NULL,
    sent_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
