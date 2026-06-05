package com.uzairtuition.enrollment;

import java.time.LocalDateTime;

public record EnrollmentRequestResponse(
        Long id,
        Long studentId,
        String studentName,
        String studentEmail,
        Long batchId,
        String batchName,
        Long courseId,
        String courseName,
        String status,
        String note,
        LocalDateTime createdAt
) {
    public static EnrollmentRequestResponse from(EnrollmentRequest r) {
        return new EnrollmentRequestResponse(
                r.getId(),
                r.getStudent().getId(),
                r.getStudent().getFirstName() + " " + r.getStudent().getLastName(),
                r.getStudent().getEmail(),
                r.getBatch().getId(),
                r.getBatch().getName(),
                r.getBatch().getCourse().getId(),
                r.getBatch().getCourse().getTitle(),
                r.getStatus(),
                r.getNote(),
                r.getCreatedAt()
        );
    }
}
