package com.uzairtuition.batch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchStudentRepository extends JpaRepository<BatchStudent, Long> {
    List<BatchStudent> findByBatchIdOrderByEnrolledAtDesc(Long batchId);
    boolean existsByBatchIdAndStudentId(Long batchId, Long studentId);
    Optional<BatchStudent> findByBatchIdAndStudentId(Long batchId, Long studentId);
    long countByBatchId(Long batchId);
    boolean existsByBatch_CourseIdAndStudentId(Long courseId, Long studentId);
}
