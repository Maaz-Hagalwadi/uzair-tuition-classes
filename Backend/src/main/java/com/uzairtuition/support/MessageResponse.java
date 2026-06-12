package com.uzairtuition.support;

public record MessageResponse(
        Long id,
        Long senderId,
        String senderName,
        String message,
        String sentAt,
        boolean isAdmin
) {}
