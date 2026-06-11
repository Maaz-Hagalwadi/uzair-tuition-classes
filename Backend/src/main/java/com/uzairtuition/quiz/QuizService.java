package com.uzairtuition.quiz;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
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
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher methods
    // -------------------------------------------------------------------------

    @Transactional
    public QuizSummaryResponse createQuiz(QuizRequest req, String teacherEmail) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(req.batchId()), "Batch");
        User teacher = EntityFinder.findOrThrow(userRepository.findByEmail(teacherEmail), "Teacher");
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

    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> getTeacherBatchQuizzes(Long batchId) {
        return quizRepository.findByBatchIdOrderByCreatedAtDesc(batchId).stream()
                .map(q -> {
                    int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(q.getId()).size();
                    return QuizSummaryResponse.from(q, count);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getQuizDetail(Long quizId) {
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(quizId), "Quiz");
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
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(id), "Quiz");
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
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(id), "Quiz");
        if ("PUBLISHED".equals(status) && !"PUBLISHED".equals(quiz.getStatus())) {
            Long quizId = quiz.getId();
            String quizTitle = quiz.getTitle();
            batchStudentRepository.findByBatchIdOrderByEnrolledAtDesc(quiz.getBatch().getId()).forEach(bs ->
                notificationService.createForUser(bs.getStudent(), "QUIZ_PUBLISHED",
                        "New Quiz Available: " + quizTitle,
                        quizTitle + " is now available in " + quiz.getBatch().getName(),
                        quizId));
        }
        quiz.setStatus(status);
        int count = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(id).size();
        return QuizSummaryResponse.from(quizRepository.save(quiz), count);
    }

    @Transactional
    public void deleteQuiz(Long id) {
        EntityFinder.findOrThrow(quizRepository.findById(id), "Quiz");
        quizRepository.deleteById(id);
    }

    @Transactional
    public QuestionResponse addQuestion(Long quizId, QuestionRequest req) {
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(quizId), "Quiz");
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
        QuizQuestion q = EntityFinder.findOrThrow(quizQuestionRepository.findById(questionId), "Question");
        quizOptionRepository.deleteByQuestionId(questionId);
        quizQuestionRepository.delete(q);
    }

    // -------------------------------------------------------------------------
    // Student methods
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public QuizDetailResponse getStudentQuizDetail(Long quizId) {
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(quizId), "Quiz");
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
        Quiz quiz = EntityFinder.findOrThrow(quizRepository.findById(quizId), "Quiz");
        if (!"PUBLISHED".equals(quiz.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz is not published.");
        }
        if (quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already attempted this quiz.");
        }
        User student = EntityFinder.findOrThrow(userRepository.findById(studentId), "Student");

        QuizAttempt attempt = quizAttemptRepository.save(QuizAttempt.builder()
                .quiz(quiz).student(student).status("IN_PROGRESS").build());

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        int totalMarks = sumTotalMarks(questions);
        int score = calculateAndPersistAnswers(attempt, req.answers());

        attempt.setScore(score);
        attempt.setTotalMarks(totalMarks);
        attempt.setStatus("SUBMITTED");
        attempt.setSubmittedAt(LocalDateTime.now());
        return AttemptResponse.from(quizAttemptRepository.save(attempt));
    }

    @Transactional(readOnly = true)
    public List<AttemptResponse> getStudentAttempts(Long studentId) {
        return quizAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .map(AttemptResponse::from)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private int sumTotalMarks(List<QuizQuestion> questions) {
        return questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum();
    }

    private int calculateAndPersistAnswers(QuizAttempt attempt, List<AnswerRequest> answers) {
        int score = 0;
        for (AnswerRequest ans : answers) {
            QuizQuestion question = EntityFinder.findOrThrow(
                    quizQuestionRepository.findById(ans.questionId()), "Question");
            List<QuizOption> opts = quizOptionRepository.findByQuestionIdOrderByOrderIndexAsc(ans.questionId());
            boolean isCorrect = opts.stream()
                    .anyMatch(o -> o.getId().equals(ans.selectedOptionId()) && Boolean.TRUE.equals(o.getIsCorrect()));
            if (isCorrect) {
                score += question.getMarks() != null ? question.getMarks() : 1;
            }
            quizAnswerRepository.save(QuizAnswer.builder()
                    .attempt(attempt)
                    .question(question)
                    .selectedOptionIds(new Long[]{ans.selectedOptionId()})
                    .isCorrect(isCorrect)
                    .build());
        }
        return score;
    }
}
