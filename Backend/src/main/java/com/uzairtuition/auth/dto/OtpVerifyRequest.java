package com.uzairtuition.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(
        @NotBlank String email,
        @NotBlank String otp
) {}
