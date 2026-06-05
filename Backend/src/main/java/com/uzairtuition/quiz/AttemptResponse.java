package com.uzairtuition.quiz;

import java.time.LocalDateTime;

public record AttemptResponse(
        Long id,
        Long quizId,
        String quizTitle,
        Integer score,
        Integer totalMarks,
        String status,
        LocalDateTime submittedAt
) {

    public static AttemptResponse from(QuizAttempt a) {
        return new AttemptResponse(
                a.getId(),
                a.getQuiz().getId(),
                a.getQuiz().getTitle(),
                a.getScore(),
                a.getTotalMarks(),
                a.getStatus(),
                a.getSubmittedAt()
        );
    }
}
