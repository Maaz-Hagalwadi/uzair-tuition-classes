package com.uzairtuition.user;

import java.math.BigDecimal;
import java.util.List;

public record ProgressResponse(

        // Overall attendance
        int overallAttendancePct,
        int totalSessionsAttended,
        int totalSessions,

        // Quizzes
        int avgQuizScorePct,
        int totalQuizzesTaken,

        // Payments
        BigDecimal pendingPaymentAmount,
        BigDecimal paidPaymentAmount,

        // Assignments
        int totalAssignments,
        int assignmentsSubmitted,
        int assignmentsGraded,
        int avgAssignmentMarksPct,

        // Per-batch breakdown
        List<BatchProgress> batches

) {

    public record BatchProgress(
            long batchId,
            String batchName,
            int attendancePct,
            int quizzesTaken,
            int avgScore,
            int assignmentsTotal,
            int assignmentsSubmitted
    ) {}
}
