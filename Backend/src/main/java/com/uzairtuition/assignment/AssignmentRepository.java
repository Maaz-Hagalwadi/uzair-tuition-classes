package com.uzairtuition.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByBatchIdOrderByCreatedAtDesc(Long batchId);
    List<Assignment> findByBatchIdInOrderByDueDateAsc(List<Long> batchIds);
}
