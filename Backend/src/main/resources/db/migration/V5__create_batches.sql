CREATE TABLE batches (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    course_id    BIGINT NOT NULL REFERENCES courses(id),
    teacher_id   BIGINT REFERENCES users(id),
    start_date   DATE NOT NULL,
    end_date     DATE,
    timings      VARCHAR(200),
    max_students INT DEFAULT 30,
    status       VARCHAR(50) DEFAULT 'UPCOMING',
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE batch_students (
    id          BIGSERIAL PRIMARY KEY,
    batch_id    BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (batch_id, student_id)
);
