package com.uzairtuition.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizIdOrderByOrderIndexAsc(Long quizId);

    void deleteByQuizId(Long quizId);
}
