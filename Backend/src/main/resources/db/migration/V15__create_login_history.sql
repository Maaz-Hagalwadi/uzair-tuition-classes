CREATE TABLE login_history (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address   VARCHAR(60),
    user_agent   TEXT,
    browser      VARCHAR(80),
    os           VARCHAR(80),
    device       VARCHAR(20),
    logged_in_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_history_user_id     ON login_history(user_id);
CREATE INDEX idx_login_history_logged_in_at ON login_history(logged_in_at DESC);
