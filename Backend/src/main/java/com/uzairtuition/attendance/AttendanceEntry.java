package com.uzairtuition.attendance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AttendanceEntry(
        @NotNull Long studentId,
        @NotBlank String status,   // PRESENT, ABSENT, LATE
        String notes
) {}
