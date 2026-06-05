package com.uzairtuition.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByBatchIdOrderByCreatedAtDesc(Long batchId);

    List<Quiz> findByBatchIdAndStatusOrderByCreatedAtDesc(Long batchId, String status);
}
