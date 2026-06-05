package com.uzairtuition.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CourseMaterialRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 500) String fileUrl,
        @Size(max = 50) String fileType
) {}
