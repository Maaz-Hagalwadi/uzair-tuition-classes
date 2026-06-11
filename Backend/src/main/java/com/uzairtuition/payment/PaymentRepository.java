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

    @Query(value = "SELECT EXTRACT(YEAR FROM created_at) AS yr, EXTRACT(MONTH FROM created_at) AS mo, SUM(amount) AS total " +
                   "FROM payments WHERE status = 'PAID' AND created_at >= :since " +
                   "GROUP BY yr, mo ORDER BY yr, mo",
           nativeQuery = true)
    List<Object[]> monthlyRevenue(@Param("since") LocalDateTime since);
}
