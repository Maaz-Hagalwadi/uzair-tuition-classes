package com.uzairtuition.classsession;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record ClassSessionRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull LocalDate sessionDate,
        @NotNull LocalTime startTime,
        LocalTime endTime,
        @Size(max = 500) String meetingUrl,
        @Pattern(regexp = "GOOGLE_MEET|ZOOM|MICROSOFT_TEAMS|OTHER|") String meetingPlatform
) {}
