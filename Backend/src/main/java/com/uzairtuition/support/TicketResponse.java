package com.uzairtuition.support;

public record TicketResponse(
        Long id,
        String subject,
        String status,
        String studentName,
        long messageCount,
        String createdAt,
        String updatedAt
) {}
