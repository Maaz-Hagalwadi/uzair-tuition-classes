package com.uzairtuition.payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long studentId,
        String studentName,
        Long batchId,
        String batchName,
        BigDecimal amount,
        String status,
        LocalDate paymentDate,
        String notes,
        LocalDateTime createdAt
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getStudent().getId(),
                p.getStudent().getFirstName() + " " + p.getStudent().getLastName(),
                p.getBatch().getId(),
                p.getBatch().getName(),
                p.getAmount(),
                p.getStatus(),
                p.getPaymentDate(),
                p.getNotes(),
                p.getCreatedAt()
        );
    }
}
