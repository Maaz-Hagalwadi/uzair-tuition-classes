package com.uzairtuition.quiz;

import jakarta.validation.constraints.NotNull;

public record AnswerRequest(
        @NotNull Long questionId,
        @NotNull Long selectedOptionId
) {}
