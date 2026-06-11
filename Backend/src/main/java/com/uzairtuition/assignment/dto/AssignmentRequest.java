package com.uzairtuition.assignment.dto;

public record AssignmentRequest(
        String title,
        String description,
        String dueDate,
        Integer maxMarks,
        Long batchId,
        String attachmentUrl
) {}
