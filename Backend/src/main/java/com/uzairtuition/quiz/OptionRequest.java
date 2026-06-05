package com.uzairtuition.quiz;

import jakarta.validation.constraints.NotBlank;

public record OptionRequest(
        @NotBlank String optionText,
        boolean isCorrect
) {}
