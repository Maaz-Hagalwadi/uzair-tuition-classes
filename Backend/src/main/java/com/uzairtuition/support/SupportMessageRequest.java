package com.uzairtuition.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportMessageRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 2000) String message
) {}
