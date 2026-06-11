package com.uzairtuition.classsession;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record BulkSessionRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull LocalTime startTime,
        LocalTime endTime,
        @Size(max = 500) String meetingUrl,
        @Pattern(regexp = "GOOGLE_MEET|ZOOM|MICROSOFT_TEAMS|OTHER|") String meetingPlatform,
        @NotEmpty List<Integer> daysOfWeek
) {}
