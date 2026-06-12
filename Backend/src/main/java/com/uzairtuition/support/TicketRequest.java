package com.uzairtuition.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank String message
) {}
