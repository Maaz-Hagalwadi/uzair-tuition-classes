package com.uzairtuition.push;

import jakarta.validation.constraints.NotBlank;

public record FcmTokenRequest(@NotBlank String token) {}
