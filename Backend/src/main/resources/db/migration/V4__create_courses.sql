CREATE TABLE courses (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    duration      VARCHAR(100),
    thumbnail_url VARCHAR(500),
    status        VARCHAR(50) DEFAULT 'ACTIVE',
    created_by    BIGINT REFERENCES users(id),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_materials (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    file_type   VARCHAR(50),
    uploaded_by BIGINT REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);
