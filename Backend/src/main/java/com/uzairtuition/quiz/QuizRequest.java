package com.uzairtuition.quiz;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuizRequest(
        @NotBlank String title,
        String description,
        @NotNull Long batchId,
        Integer timeLimitMinutes
) {}
