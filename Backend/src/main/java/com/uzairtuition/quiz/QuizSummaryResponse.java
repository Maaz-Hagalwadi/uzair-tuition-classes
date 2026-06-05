package com.uzairtuition.quiz;

import java.time.LocalDateTime;

public record QuizSummaryResponse(
        Long id,
        String title,
        String description,
        Long batchId,
        String batchName,
        String createdByName,
        Integer timeLimitMinutes,
        String status,
        int questionCount,
        LocalDateTime createdAt
) {

    public static QuizSummaryResponse from(Quiz q, int questionCount) {
        String createdByName = q.getCreatedBy() != null
                ? q.getCreatedBy().getFirstName() + " " + q.getCreatedBy().getLastName()
                : null;
        return new QuizSummaryResponse(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getBatch().getId(),
                q.getBatch().getName(),
                createdByName,
                q.getTimeLimitMinutes(),
                q.getStatus(),
                questionCount,
                q.getCreatedAt()
        );
    }
}
