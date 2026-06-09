package com.uzairtuition.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AiChatRequest(
        @NotEmpty @Size(max = 50) @Valid List<AiMessage> messages
) {}
