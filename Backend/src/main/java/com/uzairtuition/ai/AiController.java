package com.uzairtuition.ai;

import com.uzairtuition.admin.AnalyticsController;
import com.uzairtuition.user.StudentProgressController;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AnalyticsController analyticsController;
    private final StudentProgressController studentProgressController;
    private final UserRepository userRepository;

    // ── Student ───────────────────────────────────────────────────────────────

    @PostMapping("/api/ai/chat")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest req) {
        return aiService.chat(req.messages());
    }

    // ── Teacher ───────────────────────────────────────────────────────────────

    @PostMapping("/api/teacher/ai/quiz-questions")
    @PreAuthorize("hasRole('TEACHER')")
    public List<GeneratedQuestion> generateQuizQuestions(
            @Valid @RequestBody QuizGenerateRequest req) {
        return aiService.generateQuizQuestions(req.topic(), req.difficulty(), req.count());
    }

    @PostMapping("/api/teacher/ai/assignment")
    @PreAuthorize("hasRole('TEACHER')")
    public AssignmentDraft generateAssignment(
            @Valid @RequestBody AssignmentGenerateRequest req) {
        return aiService.generateAssignment(req.topic(), req.context());
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @PostMapping("/api/admin/ai/report-insights")
    @PreAuthorize("hasRole('ADMIN')")
    public AiTextResponse reportInsights() {
        return aiService.generateReportInsights(analyticsController.getAnalytics());
    }

    @PostMapping("/api/admin/ai/announcement")
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementDraft generateAnnouncement(
            @Valid @RequestBody AnnouncementGenerateRequest req) {
        return aiService.generateAnnouncement(req.topic(), req.audience(), req.tone());
    }

    @PostMapping("/api/admin/ai/student-summary/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public AiTextResponse studentSummary(@PathVariable Long studentId) {
        var student = EntityFinder.findOrThrow(userRepository.findById(studentId), "Student");
        String name = student.getFirstName() + " " + student.getLastName();
        var progress = studentProgressController.computeProgress(studentId);
        return aiService.generateStudentSummary(name, progress);
    }
}
