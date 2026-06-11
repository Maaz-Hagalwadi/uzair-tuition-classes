package com.uzairtuition.ai;

import jakarta.validation.constraints.*;

public record AnnouncementGenerateRequest(
        @NotBlank @Size(max = 500) String topic,
        @NotBlank String audience,
        @NotBlank String tone
) {}
