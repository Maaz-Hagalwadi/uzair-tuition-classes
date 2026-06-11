package com.uzairtuition.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Payment> findByBatchIdOrderByCreatedAtDesc(Long batchId);
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID'")
    BigDecimal sumPaidRevenue();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status IN ('PENDING', 'OVERDUE')")
    BigDecimal sumPendingRevenue();

    @Query("SELECT YEAR(p.createdAt) as yr, MONTH(p.createdAt) as mo, SUM(p.amount) as total " +
           "FROM Payment p WHERE p.status = 'PAID' AND p.createdAt >= :since " +
           "GROUP BY YEAR(p.createdAt), MONTH(p.createdAt) ORDER BY yr, mo")
    List<Object[]> monthlyRevenue(@Param("since") LocalDateTime since);
}
