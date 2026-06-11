CREATE TABLE assignment_submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP NOT NULL DEFAULT now(),
  text_answer TEXT,
  file_url TEXT,
  marks_obtained INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP,
  graded_by BIGINT REFERENCES users(id),
  UNIQUE(assignment_id, student_id)
);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
