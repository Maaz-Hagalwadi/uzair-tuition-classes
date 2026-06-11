package com.uzairtuition.ai;

import java.util.List;

public record GeneratedQuestion(
        String questionText,
        List<GeneratedOption> options
) {
    public record GeneratedOption(String text, boolean correct) {}
}
