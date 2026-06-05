package com.uzairtuition.quiz;

import com.uzairtuition.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/api/teacher/quizzes")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public QuizSummaryResponse createQuiz(@Valid @RequestBody QuizRequest req, Principal principal) {
        return quizService.createQuiz(req, principal.getName());
    }

    @GetMapping("/api/teacher/batches/{batchId}/quizzes")
    @PreAuthorize("hasRole('TEACHER')")
    public List<QuizSummaryResponse> getTeacherBatchQuizzes(@PathVariable Long batchId) {
        return quizService.getTeacherBatchQuizzes(batchId);
    }

    @GetMapping("/api/teacher/quizzes/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public QuizDetailResponse getQuizDetail(@PathVariable Long id) {
        return quizService.getQuizDetail(id);
    }

    @PutMapping("/api/teacher/quizzes/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public QuizSummaryResponse updateQuiz(@PathVariable Long id, @Valid @RequestBody QuizRequest req) {
        return quizService.updateQuiz(id, req);
    }

    @PutMapping("/api/teacher/quizzes/{id}/status")
    @PreAuthorize("hasRole('TEACHER')")
    public QuizSummaryResponse updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return quizService.updateStatus(id, body.get("status"));
    }

    @DeleteMapping("/api/teacher/quizzes/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
    }

    @PostMapping("/api/teacher/quizzes/{id}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionResponse addQuestion(@PathVariable Long id, @Valid @RequestBody QuestionRequest req) {
        return quizService.addQuestion(id, req);
    }

    @DeleteMapping("/api/teacher/questions/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestion(@PathVariable Long id) {
        quizService.deleteQuestion(id);
    }

    // -------------------------------------------------------------------------
    // Student endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/student/quizzes")
    @PreAuthorize("hasRole('STUDENT')")
    public List<QuizSummaryResponse> getStudentQuizzes(Principal principal) {
        var user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        return quizService.getStudentQuizzes(user.getId());
    }

    @GetMapping("/api/student/quizzes/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public QuizDetailResponse getStudentQuizDetail(@PathVariable Long id) {
        return quizService.getStudentQuizDetail(id);
    }

    @PostMapping("/api/student/quizzes/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public AttemptResponse submitAttempt(@PathVariable Long id, @Valid @RequestBody AttemptSubmitRequest req,
                                         Principal principal) {
        var user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        return quizService.submitAttempt(id, user.getId(), req);
    }

    @GetMapping("/api/student/attempts")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AttemptResponse> getStudentAttempts(Principal principal) {
        var user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        return quizService.getStudentAttempts(user.getId());
    }
}
