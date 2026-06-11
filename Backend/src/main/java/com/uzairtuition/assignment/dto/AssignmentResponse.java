package com.uzairtuition.assignment.dto;

import com.uzairtuition.assignment.Assignment;

import java.time.format.DateTimeFormatter;

public record AssignmentResponse(
        Long id,
        Long batchId,
        String batchName,
        String createdByName,
        String title,
        String description,
        String dueDate,
        Integer maxMarks,
        String attachmentUrl,
        String status,
        long submissionCount,
        SubmissionResponse mySubmission,
        String createdAt
) {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static AssignmentResponse from(Assignment a, long submissionCount, SubmissionResponse mySubmission) {
        return new AssignmentResponse(
                a.getId(),
                a.getBatch().getId(),
                a.getBatch().getName(),
                a.getCreatedBy() != null
                        ? a.getCreatedBy().getFirstName() + " " + a.getCreatedBy().getLastName()
                        : null,
                a.getTitle(),
                a.getDescription(),
                a.getDueDate() != null ? a.getDueDate().format(FMT) : null,
                a.getMaxMarks(),
                a.getAttachmentUrl(),
                a.getStatus(),
                submissionCount,
                mySubmission,
                a.getCreatedAt() != null ? a.getCreatedAt().format(FMT) : null
        );
    }
}
