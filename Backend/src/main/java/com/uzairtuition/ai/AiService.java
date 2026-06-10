package com.uzairtuition.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    @Value("${app.groq.api-key:}")
    private String apiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL     = "llama-3.1-8b-instant";
    private static final String SYSTEM_PROMPT =
            "You are an expert academic tutor at Uzair Tuition Classes, a coaching institute. " +
            "Help students understand concepts in Mathematics, Physics, Chemistry, Biology, " +
            "English, and Computer Science. Give clear, step-by-step explanations. " +
            "Use examples and analogies when helpful. Keep responses concise and focused. " +
            "If a student asks something outside academics, gently redirect them to academic topics.";

    private final RestTemplate restTemplate = new RestTemplate();

    public AiChatResponse chat(List<AiMessage> history) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is not configured. Please set GROQ_API_KEY.");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        for (AiMessage msg : history) {
            messages.add(Map.of("role", msg.role(), "content", msg.content()));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", MODEL);
        body.put("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ResponseEntity<GroqResponse> response = restTemplate.postForEntity(
                    GROQ_URL, new HttpEntity<>(body, headers), GroqResponse.class);
            return new AiChatResponse(response.getBody().choices().get(0).message().content());
        } catch (Exception e) {
            log.error("xAI API call failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI service is temporarily unavailable. Please try again.");
        }
    }
}
