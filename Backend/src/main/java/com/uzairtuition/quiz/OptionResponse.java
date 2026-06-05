package com.uzairtuition.quiz;

public record OptionResponse(Long id, String optionText, Boolean isCorrect, Integer orderIndex) {

    public static OptionResponse from(QuizOption o, boolean includeCorrect) {
        return new OptionResponse(
                o.getId(),
                o.getOptionText(),
                includeCorrect ? o.getIsCorrect() : null,
                o.getOrderIndex()
        );
    }
}
