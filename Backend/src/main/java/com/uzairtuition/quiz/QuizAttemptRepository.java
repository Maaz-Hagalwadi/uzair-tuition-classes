package com.uzairtuition.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    Optional<QuizAttempt> findByQuizIdAndStudentId(Long quizId, Long studentId);

    List<QuizAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<QuizAttempt> findByQuizIdOrderBySubmittedAtDesc(Long quizId);
}
