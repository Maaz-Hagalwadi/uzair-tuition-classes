package com.uzairtuition.quiz;

import java.util.List;

public record QuestionResponse(
        Long id,
        String questionText,
        String questionType,
        Integer marks,
        Integer orderIndex,
        List<OptionResponse> options
) {

    public static QuestionResponse from(QuizQuestion q, List<QuizOption> opts, boolean includeCorrect) {
        return new QuestionResponse(
                q.getId(),
                q.getQuestionText(),
                q.getQuestionType(),
                q.getMarks(),
                q.getOrderIndex(),
                opts.stream().map(o -> OptionResponse.from(o, includeCorrect)).toList()
        );
    }
}
