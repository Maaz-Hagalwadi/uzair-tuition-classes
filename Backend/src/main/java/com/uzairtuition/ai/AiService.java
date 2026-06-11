package com.uzairtuition.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uzairtuition.admin.AnalyticsResponse;
import com.uzairtuition.user.ProgressResponse;
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

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper  = new ObjectMapper();

    // ── Student chat ──────────────────────────────────────────────────────────

    public AiChatResponse chat(List<AiMessage> history) {
        checkApiKey();
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "You are an expert academic tutor at Uzair Tuition Classes, a coaching institute. " +
                "Help students understand concepts in Mathematics, Physics, Chemistry, Biology, " +
                "English, and Computer Science. Give clear, step-by-step explanations. " +
                "Use examples and analogies when helpful. Keep responses concise and focused. " +
                "If a student asks something outside academics, gently redirect them to academic topics."));
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

    // ── Teacher: quiz question generator ─────────────────────────────────────

    public List<GeneratedQuestion> generateQuizQuestions(String topic, String difficulty, int count) {
        String system = "You are a quiz question generator for a tutoring institute. " +
                "Respond with ONLY valid JSON — no explanation, no markdown, no code fences.";
        String user = "Generate " + count + " multiple-choice questions about \"" + topic +
                "\" at " + difficulty + " difficulty. " +
                "Return a JSON array where each element has: " +
                "\"questionText\" (string), " +
                "\"options\" (array of exactly 4 objects each with \"text\" (string) and \"correct\" (boolean)). " +
                "Exactly one option per question must have correct: true.";
        String json = extractJson(callGroq(system, user));
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, GeneratedQuestion.class));
        } catch (Exception e) {
            log.error("Failed to parse quiz JSON: {}", json);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI returned an invalid quiz format. Please try again.");
        }
    }

    // ── Teacher: assignment generator ─────────────────────────────────────────

    public AssignmentDraft generateAssignment(String topic, String context) {
        String system = "You are an assignment creator for a coaching institute. " +
                "Respond with ONLY valid JSON — no explanation, no markdown, no code fences.";
        String extra  = (context != null && !context.isBlank()) ? " Additional context: " + context : "";
        String user   = "Create an assignment for the topic: \"" + topic + "\"." + extra +
                " Return JSON with exactly these three fields: " +
                "\"title\" (concise title, max 10 words), " +
                "\"description\" (clear instructions for students, 3-5 sentences), " +
                "\"criteria\" (marking criteria as a plain string with newline-separated points, e.g. '• Point 1\\n• Point 2').";
        String json = extractJson(callGroq(system, user));
        try {
            return objectMapper.readValue(json, AssignmentDraft.class);
        } catch (Exception e) {
            log.error("Failed to parse assignment JSON: {}", json);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI returned an invalid format. Please try again.");
        }
    }

    // ── Admin: report insights ────────────────────────────────────────────────

    public AiTextResponse generateReportInsights(AnalyticsResponse data) {
        String system = "You are an educational analytics consultant. " +
                "Write a concise 3-4 sentence plain-English paragraph summarising the key observations " +
                "and any notable trends or recommendations. Be direct and professional.";
        StringBuilder ctx = new StringBuilder("Uzair Tuition Classes — current analytics:\n");
        ctx.append("Students: ").append(data.getTotalStudents())
           .append(", Teachers: ").append(data.getTotalTeachers())
           .append(", Batches: ").append(data.getTotalBatches())
           .append(" (").append(data.getActiveBatches()).append(" active)")
           .append(", Total enrollments: ").append(data.getTotalEnrollments()).append(".\n");
        ctx.append("Revenue collected: PKR ").append(data.getTotalRevenue())
           .append(", Pending: PKR ").append(data.getPendingRevenue()).append(".\n");
        if (data.getRecentMonths() != null && !data.getRecentMonths().isEmpty()) {
            ctx.append("Monthly trends (oldest to newest):\n");
            for (AnalyticsResponse.MonthlyStats m : data.getRecentMonths()) {
                ctx.append("  ").append(m.getMonth())
                   .append(": Revenue PKR ").append(m.getRevenue())
                   .append(", New enrollments: ").append(m.getEnrollments()).append("\n");
            }
        }
        if (data.getBatchOccupancy() != null && !data.getBatchOccupancy().isEmpty()) {
            ctx.append("Active batch occupancy:\n");
            for (AnalyticsResponse.BatchOccupancy b : data.getBatchOccupancy()) {
                ctx.append("  ").append(b.getBatchName()).append(": ")
                   .append(b.getEnrolled()).append("/").append(b.getMaxStudents())
                   .append(" (").append(b.getPct()).append("% full)\n");
            }
        }
        return new AiTextResponse(callGroq(system, ctx.toString()));
    }

    // ── Admin: announcement draft ─────────────────────────────────────────────

    public AnnouncementDraft generateAnnouncement(String topic, String audience, String tone) {
        String system = "You are a professional communications writer for an educational institute. " +
                "Respond with ONLY valid JSON — no explanation, no markdown, no code fences.";
        String user = "Draft an announcement for Uzair Tuition Classes. " +
                "Topic: \"" + topic + "\". Audience: " + audience + ". Tone: " + tone + ". " +
                "Return JSON with exactly: " +
                "\"title\" (announcement subject line, concise) and " +
                "\"content\" (announcement body, 2-4 sentences, professional and clear).";
        String json = extractJson(callGroq(system, user));
        try {
            return objectMapper.readValue(json, AnnouncementDraft.class);
        } catch (Exception e) {
            log.error("Failed to parse announcement JSON: {}", json);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI returned an invalid format. Please try again.");
        }
    }

    // ── Admin: student progress summary ──────────────────────────────────────

    public AiTextResponse generateStudentSummary(String studentName, ProgressResponse p) {
        String system = "You are a student progress report writer for an educational institute. " +
                "Write a clear, professional 3-4 sentence narrative summary suitable for sharing with parents or in a performance review.";
        StringBuilder ctx = new StringBuilder("Student: ").append(studentName).append("\n");
        ctx.append("Overall completion: ").append(p.overallCompletionPct()).append("%\n");
        ctx.append("Attendance: ").append(p.overallAttendancePct()).append("% (")
           .append(p.totalSessionsAttended()).append("/").append(p.totalSessions()).append(" sessions)\n");
        ctx.append("Quiz average: ").append(p.avgQuizScorePct()).append("% across ")
           .append(p.totalQuizzesTaken()).append(" quiz(zes)\n");
        ctx.append("Assignments: ").append(p.assignmentsSubmitted()).append("/")
           .append(p.totalAssignments()).append(" submitted, ")
           .append(p.assignmentsGraded()).append(" graded");
        if (p.avgAssignmentMarksPct() > 0) {
            ctx.append(", avg marks ").append(p.avgAssignmentMarksPct()).append("%");
        }
        ctx.append("\n");
        if (p.pendingPaymentAmount() != null && p.pendingPaymentAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            ctx.append("Outstanding fees: PKR ").append(p.pendingPaymentAmount()).append("\n");
        }
        if (p.batches() != null && !p.batches().isEmpty()) {
            ctx.append("Enrolled batches: ");
            ctx.append(p.batches().stream().map(ProgressResponse.BatchProgress::batchName)
                       .collect(java.util.stream.Collectors.joining(", ")));
            ctx.append("\n");
        }
        return new AiTextResponse(callGroq(system, ctx.toString()));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Strip markdown code fences that LLMs sometimes add despite being told not to. */
    private static String extractJson(String raw) {
        if (raw == null) return "";
        String s = raw.strip();
        if (s.startsWith("```")) {
            int newline = s.indexOf('\n');
            if (newline != -1) s = s.substring(newline + 1);
            if (s.endsWith("```")) s = s.substring(0, s.lastIndexOf("```"));
        }
        return s.strip();
    }

    private void checkApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is not configured. Please set GROQ_API_KEY.");
        }
    }

    private String callGroq(String systemPrompt, String userMessage) {
        checkApiKey();
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userMessage));
        Map<String, Object> body = new HashMap<>();
        body.put("model", MODEL);
        body.put("messages", messages);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        try {
            ResponseEntity<GroqResponse> response = restTemplate.postForEntity(
                    GROQ_URL, new HttpEntity<>(body, headers), GroqResponse.class);
            return response.getBody().choices().get(0).message().content();
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI service is temporarily unavailable. Please try again.");
        }
    }
}
