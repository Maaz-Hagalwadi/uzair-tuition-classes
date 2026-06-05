package com.uzairtuition.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AttendanceBulkRequest(
        @NotEmpty @Valid List<AttendanceEntry> entries
) {}
