package com.uzairtuition.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OtpSendRequest(
        @NotBlank @Email String email
) {}
