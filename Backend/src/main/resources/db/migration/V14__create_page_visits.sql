CREATE TABLE page_visits (
    id         BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(60),
    user_agent TEXT,
    browser    VARCHAR(80),
    os         VARCHAR(80),
    device     VARCHAR(20),
    page       VARCHAR(200),
    referrer   VARCHAR(500),
    visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_visits_visited_at ON page_visits(visited_at DESC);
CREATE INDEX idx_page_visits_ip         ON page_visits(ip_address);
