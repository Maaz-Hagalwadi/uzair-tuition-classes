package com.uzairtuition.batch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BatchStudentRepository extends JpaRepository<BatchStudent, Long> {
    List<BatchStudent> findByBatchIdOrderByEnrolledAtDesc(Long batchId);
    boolean existsByBatchIdAndStudentId(Long batchId, Long studentId);
    Optional<BatchStudent> findByBatchIdAndStudentId(Long batchId, Long studentId);
    long countByBatchId(Long batchId);
    boolean existsByBatch_CourseIdAndStudentId(Long courseId, Long studentId);

    @Query(value = "SELECT EXTRACT(YEAR FROM enrolled_at) AS yr, EXTRACT(MONTH FROM enrolled_at) AS mo, COUNT(*) AS cnt " +
                   "FROM batch_students WHERE enrolled_at >= :since " +
                   "GROUP BY yr, mo ORDER BY yr, mo",
           nativeQuery = true)
    List<Object[]> monthlyEnrollments(@Param("since") LocalDateTime since);
}
