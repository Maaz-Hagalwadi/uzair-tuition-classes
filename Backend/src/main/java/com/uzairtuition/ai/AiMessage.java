package com.uzairtuition.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiMessage(
        @NotBlank String role,
        @NotBlank @Size(max = 4000) String content
) {}
