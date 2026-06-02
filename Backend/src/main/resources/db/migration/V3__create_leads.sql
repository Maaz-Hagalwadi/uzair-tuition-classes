CREATE TABLE leads (
    id                BIGSERIAL PRIMARY KEY,
    full_name         VARCHAR(200) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    phone             VARCHAR(20)  NOT NULL,
    interested_course VARCHAR(200),
    message           TEXT,
    status            VARCHAR(50) DEFAULT 'NEW',
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);
