package com.uzairtuition.ai;

import jakarta.validation.constraints.*;

public record AssignmentGenerateRequest(
        @NotBlank @Size(max = 300) String topic,
        @Size(max = 1000) String context
) {}
