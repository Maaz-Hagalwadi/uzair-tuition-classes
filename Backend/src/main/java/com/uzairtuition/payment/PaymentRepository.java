package com.uzairtuition.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Payment> findByBatchIdOrderByCreatedAtDesc(Long batchId);
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
}
