package com.uzairtuition.quiz;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AttemptSubmitRequest(
        @NotEmpty List<AnswerRequest> answers
) {}
