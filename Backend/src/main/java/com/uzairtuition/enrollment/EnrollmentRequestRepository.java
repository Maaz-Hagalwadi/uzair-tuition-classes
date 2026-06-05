package com.uzairtuition.enrollment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, Long> {
    Optional<EnrollmentRequest> findByBatchIdAndStudentId(Long batchId, Long studentId);
    boolean existsByBatchIdAndStudentId(Long batchId, Long studentId);
    List<EnrollmentRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<EnrollmentRequest> findAllByOrderByCreatedAtDesc();
    List<EnrollmentRequest> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
