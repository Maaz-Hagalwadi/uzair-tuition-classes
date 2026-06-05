package com.uzairtuition.quiz;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher methods
    // -------------------------------------------------------------------------

    @Transactional
    public QuizSummaryResponse createQuiz(QuizRequest req, String teacherEmail) {
        Batch batch = batchRepository.findById(req.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found."));
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found."));
        Quiz quiz = Quiz.builder()
                .title(req.title().trim())
                .description(req.description())
                .batch(batch)
                .createdBy(teacher)
                .timeLimitMinutes(req.timeLimitMinutes())
                .status("DRAFT")
                .build();
        quiz = quizRepository.save(quiz);
        return QuizSummaryResponse.from(quiz, 0);
    }

    public List<QuizSummaryResponse> getTeacherBatchQuizzes(Long batchId) {
        return quizRepository.findByBatchIdOrderByCreatedAtDesc(batchId).stream()
                .map(q -> {
                    int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(q.getId()).size();
                    return QuizSummaryResponse.from(q, count);
                })
                .toList();
    }

    public QuizDetailResponse getQuizDetail(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<QuizOption> opts = quizOptionRepository.findByQuestionIdOrderByOrderIndexAsc(q.getId());
                    return QuestionResponse.from(q, opts, true);
                })
                .toList();
        return new QuizDetailResponse(QuizSummaryResponse.from(quiz, questions.size()), questionResponses);
    }

    @Transactional
    public QuizSummaryResponse updateQuiz(Long id, QuizRequest req) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        quiz.setTitle(req.title().trim());
        quiz.setDescription(req.description());
        quiz.setTimeLimitMinutes(req.timeLimitMinutes());
        int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(id).size();
        return QuizSummaryResponse.from(quizRepository.save(quiz), count);
    }

    @Transactional
    public QuizSummaryResponse updateStatus(Long id, String status) {
        if (!Set.of("DRAFT", "PUBLISHED", "CLOSED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status.");
        }
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        quiz.setStatus(status);
        int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(id).size();
        return QuizSummaryResponse.from(quizRepository.save(quiz), count);
    }

    @Transactional
    public void deleteQuiz(Long id) {
        quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        quizRepository.deleteById(id);
    }

    @Transactional
    public QuestionResponse addQuestion(Long quizId, QuestionRequest req) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        int nextIndex = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quizId).size();
        QuizQuestion q = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(req.questionText().trim())
                .questionType("MCQ")
                .marks(req.marks())
                .orderIndex(nextIndex)
                .build();
        q = quizQuestionRepository.save(q);
        final QuizQuestion savedQ = q;
        List<QuizOption> opts = new ArrayList<>();
        for (int i = 0; i < req.options().size(); i++) {
            OptionRequest o = req.options().get(i);
            opts.add(quizOptionRepository.save(QuizOption.builder()
                    .question(savedQ)
                    .optionText(o.optionText().trim())
                    .isCorrect(o.isCorrect())
                    .orderIndex(i)
                    .build()));
        }
        return QuestionResponse.from(savedQ, opts, true);
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        QuizQuestion q = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found."));
        quizOptionRepository.deleteByQuestionId(questionId);
        quizQuestionRepository.delete(q);
    }

    // -------------------------------------------------------------------------
    // Student methods
    // -------------------------------------------------------------------------

    public List<QuizSummaryResponse> getStudentQuizzes(Long studentId) {
        List<Batch> batches = batchRepository.findByStudentId(studentId);
        return batches.stream()
                .flatMap(b ->
                        quizRepository.findByBatchIdAndStatusOrderByCreatedAtDesc(b.getId(), "PUBLISHED").stream()
                                .map(q -> {
                                    int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(q.getId()).size();
                                    return QuizSummaryResponse.from(q, count);
                                })
                )
                .toList();
    }

    public QuizDetailResponse getStudentQuizDetail(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        List<QuestionResponse> qResponses = questions.stream()
                .map(q -> {
                    List<QuizOption> opts = quizOptionRepository.findByQuestionIdOrderByOrderIndexAsc(q.getId());
                    return QuestionResponse.from(q, opts, false);
                })
                .toList();
        return new QuizDetailResponse(QuizSummaryResponse.from(quiz, questions.size()), qResponses);
    }

    @Transactional
    public AttemptResponse submitAttempt(Long quizId, Long studentId, AttemptSubmitRequest req) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        if (!"PUBLISHED".equals(quiz.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz is not published.");
        }
        if (quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already attempted this quiz.");
        }
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found."));
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .status("IN_PROGRESS")
                .build();
        attempt = quizAttemptRepository.save(attempt);
        final QuizAttempt savedAttempt = attempt;

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        int totalMarks = questions.stream()
                .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1)
                .sum();
        int score = 0;

        for (AnswerRequest ans : req.answers()) {
            QuizQuestion question = quizQuestionRepository.findById(ans.questionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found."));
            List<QuizOption> opts = quizOptionRepository.findByQuestionIdOrderByOrderIndexAsc(ans.questionId());
            boolean isCorrect = opts.stream()
                    .anyMatch(o -> o.getId().equals(ans.selectedOptionId()) && Boolean.TRUE.equals(o.getIsCorrect()));
            if (isCorrect) {
                score += question.getMarks() != null ? question.getMarks() : 1;
            }
            QuizAnswer answer = QuizAnswer.builder()
                    .attempt(savedAttempt)
                    .question(question)
                    .selectedOptionIds(new Long[]{ans.selectedOptionId()})
                    .isCorrect(isCorrect)
                    .build();
            quizAnswerRepository.save(answer);
        }

        attempt.setScore(score);
        attempt.setTotalMarks(totalMarks);
        attempt.setStatus("SUBMITTED");
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt = quizAttemptRepository.save(attempt);
        return AttemptResponse.from(attempt);
    }

    public List<AttemptResponse> getStudentAttempts(Long studentId) {
        return quizAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .map(AttemptResponse::from)
                .toList();
    }
}
