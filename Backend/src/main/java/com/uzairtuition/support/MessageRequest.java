package com.uzairtuition.support;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(@NotBlank String message) {}
