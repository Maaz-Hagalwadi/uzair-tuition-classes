package com.uzairtuition.lead;

import java.time.LocalDateTime;

public record LeadResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String interestedCourse,
        String message,
        String status,
        LocalDateTime createdAt
) {
    public static LeadResponse from(Lead lead) {
        return new LeadResponse(
                lead.getId(),
                lead.getFullName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getInterestedCourse(),
                lead.getMessage(),
                lead.getStatus(),
                lead.getCreatedAt()
        );
    }
}
