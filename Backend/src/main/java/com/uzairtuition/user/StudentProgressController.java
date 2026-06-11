package com.uzairtuition.user;

import com.uzairtuition.assignment.Assignment;
import com.uzairtuition.assignment.AssignmentRepository;
import com.uzairtuition.assignment.AssignmentSubmission;
import com.uzairtuition.assignment.AssignmentSubmissionRepository;
import com.uzairtuition.attendance.Attendance;
import com.uzairtuition.attendance.AttendanceRepository;
import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.classsession.ClassSessionRepository;
import com.uzairtuition.payment.Payment;
import com.uzairtuition.payment.PaymentRepository;
import com.uzairtuition.quiz.QuizAttempt;
import com.uzairtuition.quiz.QuizAttemptRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class StudentProgressController {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final ClassSessionRepository classSessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final PaymentRepository paymentRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;

    @GetMapping("/api/student/progress")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ProgressResponse getProgress(Principal principal) {

        User student = EntityFinder.findOrThrow(
                userRepository.findByEmail(principal.getName()), "User");
        Long studentId = student.getId();

        // ── Batches ──────────────────────────────────────────────────────────
        List<Batch> batches = batchRepository.findByStudentId(studentId);
        List<Long> batchIds = batches.stream().map(Batch::getId).toList();

        // ── Attendance ───────────────────────────────────────────────────────
        List<Attendance> allAttendance = attendanceRepository.findByStudentId(studentId);

        // Group attendance records by batch id for per-batch calculations
        Map<Long, List<Attendance>> attendanceByBatch = allAttendance.stream()
                .collect(Collectors.groupingBy(a -> a.getSession().getBatch().getId()));

        // Total sessions per batch (regardless of whether attendance was recorded)
        Map<Long, Integer> sessionCountByBatch = batchIds.stream()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> classSessionRepository.findByBatchIdOrderBySessionDateDesc(id).size()
                ));

        int totalSessions = sessionCountByBatch.values().stream().mapToInt(Integer::intValue).sum();
        long totalAttended = allAttendance.stream()
                .filter(a -> "PRESENT".equals(a.getStatus()) || "LATE".equals(a.getStatus()))
                .count();
        int overallAttendancePct = totalSessions > 0
                ? (int) Math.round(totalAttended * 100.0 / totalSessions)
                : 0;

        // ── Quiz attempts ────────────────────────────────────────────────────
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId)
                .stream()
                .filter(a -> "SUBMITTED".equals(a.getStatus()) || "COMPLETED".equals(a.getStatus()))
                .toList();

        // quiz.batch.id — collect quizzes for batchIds to do per-batch breakdown
        // Group submitted attempts by batch id via quiz's batch
        Map<Long, List<QuizAttempt>> attemptsByBatch = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getQuiz().getBatch().getId()));

        int totalQuizzesTaken = attempts.size();
        int avgQuizScorePct = computeAvgQuizPct(attempts);

        // ── Payments ─────────────────────────────────────────────────────────
        List<Payment> payments = paymentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);

        BigDecimal pendingAmount = payments.stream()
                .filter(p -> "PENDING".equals(p.getStatus()) || "OVERDUE".equals(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidAmount = payments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Assignments ──────────────────────────────────────────────────────
        List<Assignment> allAssignments = assignmentRepository.findByBatchIdInOrderByDueDateAsc(batchIds);

        List<AssignmentSubmission> allSubmissions =
                assignmentSubmissionRepository.findByStudentIdAndAssignment_BatchIdIn(studentId, batchIds);

        int totalAssignments = allAssignments.size();
        int submittedCount = allSubmissions.size();
        int gradedCount = (int) allSubmissions.stream()
                .filter(s -> s.getGradedAt() != null)
                .count();

        int avgAssignmentMarksPct = computeAvgAssignmentPct(allSubmissions, allAssignments);

        // ── Per-batch breakdown ───────────────────────────────────────────────
        List<ProgressResponse.BatchProgress> batchBreakdown = batches.stream().map(batch -> {
            Long batchId = batch.getId();

            // Attendance for this batch
            List<Attendance> batchAtt = attendanceByBatch.getOrDefault(batchId, List.of());
            int batchSessions = sessionCountByBatch.getOrDefault(batchId, 0);
            long batchAttended = batchAtt.stream()
                    .filter(a -> "PRESENT".equals(a.getStatus()) || "LATE".equals(a.getStatus()))
                    .count();
            int batchAttPct = batchSessions > 0
                    ? (int) Math.round(batchAttended * 100.0 / batchSessions)
                    : 0;

            // Quizzes for this batch
            List<QuizAttempt> batchAttempts = attemptsByBatch.getOrDefault(batchId, List.of());
            int batchQuizzesTaken = batchAttempts.size();
            int batchAvgScore = computeAvgQuizPct(batchAttempts);

            // Assignments for this batch
            List<Assignment> batchAssignments = allAssignments.stream()
                    .filter(a -> a.getBatch().getId().equals(batchId))
                    .toList();
            Set<Long> batchAssignmentIds = batchAssignments.stream()
                    .map(Assignment::getId)
                    .collect(Collectors.toSet());
            int batchAssignmentsTotal = batchAssignments.size();
            int batchSubmitted = (int) allSubmissions.stream()
                    .filter(s -> batchAssignmentIds.contains(s.getAssignment().getId()))
                    .count();

            return new ProgressResponse.BatchProgress(
                    batchId,
                    batch.getName(),
                    batchAttPct,
                    batchQuizzesTaken,
                    batchAvgScore,
                    batchAssignmentsTotal,
                    batchSubmitted
            );
        }).toList();

        int assignmentPct = totalAssignments > 0
                ? (int) Math.round(submittedCount * 100.0 / totalAssignments) : 0;
        int overallCompletionPct = (int) Math.round(
                overallAttendancePct * 0.4 + assignmentPct * 0.4 + avgQuizScorePct * 0.2);

        return new ProgressResponse(
                overallCompletionPct,
                overallAttendancePct,
                (int) totalAttended,
                totalSessions,
                avgQuizScorePct,
                totalQuizzesTaken,
                pendingAmount,
                paidAmount,
                totalAssignments,
                submittedCount,
                gradedCount,
                avgAssignmentMarksPct,
                batchBreakdown
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int computeAvgQuizPct(List<QuizAttempt> attempts) {
        List<QuizAttempt> scored = attempts.stream()
                .filter(a -> a.getScore() != null && a.getTotalMarks() != null && a.getTotalMarks() > 0)
                .toList();
        if (scored.isEmpty()) return 0;
        double avg = scored.stream()
                .mapToDouble(a -> a.getScore() * 100.0 / a.getTotalMarks())
                .average()
                .orElse(0);
        return (int) Math.round(avg);
    }

    private int computeAvgAssignmentPct(List<AssignmentSubmission> submissions,
                                        List<Assignment> assignments) {
        // Build a map of assignment id -> maxMarks for reference
        Map<Long, Integer> maxMarksById = assignments.stream()
                .collect(Collectors.toMap(Assignment::getId, Assignment::getMaxMarks));

        List<AssignmentSubmission> graded = submissions.stream()
                .filter(s -> s.getMarksObtained() != null && s.getGradedAt() != null)
                .toList();
        if (graded.isEmpty()) return 0;

        double avg = graded.stream()
                .mapToDouble(s -> {
                    int maxMarks = maxMarksById.getOrDefault(s.getAssignment().getId(), 100);
                    return maxMarks > 0 ? s.getMarksObtained() * 100.0 / maxMarks : 0;
                })
                .average()
                .orElse(0);
        return (int) Math.round(avg);
    }
}
