package com.uzairtuition.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull Long studentId,
        @NotNull Long batchId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String status,
        LocalDate paymentDate,
        String notes
) {}
