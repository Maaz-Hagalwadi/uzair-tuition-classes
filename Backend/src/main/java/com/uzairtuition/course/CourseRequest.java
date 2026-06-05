package com.uzairtuition.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank @Size(max = 200) String title,
        String description,
        @Size(max = 100) String duration,
        @Size(max = 500) String thumbnailUrl,
        @Pattern(regexp = "ACTIVE|DRAFT|INACTIVE") String status
) {}
