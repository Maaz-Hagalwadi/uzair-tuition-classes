package com.uzairtuition.announcement;

import jakarta.validation.constraints.NotBlank;

public record AnnouncementRequest(
        @NotBlank String title,
        @NotBlank String content,
        Long batchId   // nullable — if null, applies to all batches (site-wide)
) {}
