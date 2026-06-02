CREATE TABLE quizzes (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    batch_id           BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_by         BIGINT REFERENCES users(id),
    time_limit_minutes INT,
    status             VARCHAR(50) DEFAULT 'DRAFT',
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quiz_questions (
    id            BIGSERIAL PRIMARY KEY,
    quiz_id       BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    marks         INT DEFAULT 1,
    order_index   INT,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quiz_options (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct  BOOLEAN DEFAULT FALSE,
    order_index INT
);

CREATE TABLE quiz_attempts (
    id           BIGSERIAL PRIMARY KEY,
    quiz_id      BIGINT NOT NULL REFERENCES quizzes(id),
    student_id   BIGINT NOT NULL REFERENCES users(id),
    started_at   TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    score        INT,
    total_marks  INT,
    status       VARCHAR(50) DEFAULT 'IN_PROGRESS',
    UNIQUE (quiz_id, student_id)
);

CREATE TABLE quiz_answers (
    id                  BIGSERIAL PRIMARY KEY,
    attempt_id          BIGINT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id         BIGINT NOT NULL REFERENCES quiz_questions(id),
    selected_option_ids BIGINT[],
    is_correct          BOOLEAN
);
