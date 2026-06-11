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

    @Query("SELECT YEAR(bs.enrolledAt) as yr, MONTH(bs.enrolledAt) as mo, COUNT(bs) as cnt " +
           "FROM BatchStudent bs WHERE bs.enrolledAt >= :since " +
           "GROUP BY YEAR(bs.enrolledAt), MONTH(bs.enrolledAt) ORDER BY yr, mo")
    List<Object[]> monthlyEnrollments(@Param("since") LocalDateTime since);
}
