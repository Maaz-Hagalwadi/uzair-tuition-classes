package com.uzairtuition.ai;

import jakarta.validation.constraints.*;

public record QuizGenerateRequest(
        @NotBlank @Size(max = 200) String topic,
        @NotBlank String difficulty,
        @Min(1) @Max(10) int count
) {}
