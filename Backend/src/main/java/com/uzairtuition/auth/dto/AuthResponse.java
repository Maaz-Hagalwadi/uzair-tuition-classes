package com.uzairtuition.auth.dto;

import java.util.Set;

public record AuthResponse(
        String accessToken,
        String firstName,
        String lastName,
        String email,
        Set<String> roles
) {}
