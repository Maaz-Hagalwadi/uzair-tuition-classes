package com.uzairtuition.user;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String profilePictureUrl,
        List<String> roles,
        boolean active,
        boolean emailVerified,
        String approvalStatus,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getProfilePictureUrl(),
                user.getRoles().stream().map(Role::getName).sorted().toList(),
                user.isActive(),
                user.isEmailVerified(),
                user.getApprovalStatus(),
                user.getCreatedAt()
        );
    }
}
