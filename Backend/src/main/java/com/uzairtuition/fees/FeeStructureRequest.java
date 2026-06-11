package com.uzairtuition.fees;

import java.math.BigDecimal;

public record FeeStructureRequest(
        String feeType,
        BigDecimal amount,
        String description,
        Integer dueDay
) {}
