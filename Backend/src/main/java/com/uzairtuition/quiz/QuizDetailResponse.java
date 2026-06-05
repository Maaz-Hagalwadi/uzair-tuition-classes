package com.uzairtuition.quiz;

import java.util.List;

public record QuizDetailResponse(QuizSummaryResponse summary, List<QuestionResponse> questions) {}
