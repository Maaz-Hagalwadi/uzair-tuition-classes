package com.uzairtuition.batch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record BatchRequest(
        @NotBlank @Size(max = 200) String name,
        @NotNull Long courseId,
        Long teacherId,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @Size(max = 200) String timings,
        Integer maxStudents,
        @Pattern(regexp = "UPCOMING|ACTIVE|COMPLETED") String status
) {}
