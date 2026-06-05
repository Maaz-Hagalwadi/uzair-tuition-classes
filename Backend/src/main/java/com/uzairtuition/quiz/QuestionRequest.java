package com.uzairtuition.quiz;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuestionRequest(
        @NotBlank String questionText,
        @Min(1) int marks,
        @NotEmpty List<OptionRequest> options
) {}
