package com.uzairtuition.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {

    List<QuizOption> findByQuestionIdOrderByOrderIndexAsc(Long questionId);

    void deleteByQuestionId(Long questionId);
}
