package com.uzairtuition.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(min = 2, max = 50) String firstName,
        @NotBlank @Size(min = 2, max = 50) String lastName,
        @Pattern(regexp = "^$|^[+\\d][\\d\\s\\-().]{6,19}$", message = "Enter a valid phone number.")
        String phone
) {}
