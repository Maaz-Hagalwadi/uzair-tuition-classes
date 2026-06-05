package com.uzairtuition.batch;

import java.time.LocalDateTime;

public record BatchStudentResponse(
        Long studentId,
        String firstName,
        String lastName,
        String email,
        String phone,
        LocalDateTime enrolledAt
) {
    public static BatchStudentResponse from(BatchStudent bs) {
        return new BatchStudentResponse(
                bs.getStudent().getId(),
                bs.getStudent().getFirstName(),
                bs.getStudent().getLastName(),
                bs.getStudent().getEmail(),
                bs.getStudent().getPhone(),
                bs.getEnrolledAt()
        );
    }
}
