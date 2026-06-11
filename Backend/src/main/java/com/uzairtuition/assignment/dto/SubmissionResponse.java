package com.uzairtuition.assignment.dto;

import com.uzairtuition.assignment.AssignmentSubmission;

import java.time.format.DateTimeFormatter;

public record SubmissionResponse(
        Long id,
        Long assignmentId,
        String assignmentTitle,
        Long studentId,
        String studentName,
        String submittedAt,
        String textAnswer,
        String fileUrl,
        Integer marksObtained,
        String feedback,
        String gradedAt,
        boolean graded
) {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static SubmissionResponse from(AssignmentSubmission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getAssignment().getId(),
                s.getAssignment().getTitle(),
                s.getStudent().getId(),
                s.getStudent().getFirstName() + " " + s.getStudent().getLastName(),
                s.getSubmittedAt() != null ? s.getSubmittedAt().format(FMT) : null,
                s.getTextAnswer(),
                s.getFileUrl(),
                s.getMarksObtained(),
                s.getFeedback(),
                s.getGradedAt() != null ? s.getGradedAt().format(FMT) : null,
                s.getGradedAt() != null
        );
    }
}
