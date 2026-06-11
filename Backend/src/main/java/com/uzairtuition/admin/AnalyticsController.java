package com.uzairtuition.admin;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.payment.PaymentRepository;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final PaymentRepository paymentRepository;

    @GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {

        // ── Counts ──────────────────────────────────────────────────────────
        long totalStudents   = userRepository.findByRoleName("STUDENT").size();
        long totalTeachers   = userRepository.findByRoleName("TEACHER").size();
        long totalBatches    = batchRepository.count();
        long activeBatches   = batchRepository.findByStatusOrderByStartDateDesc("ACTIVE").size();
        long totalEnrollments = batchStudentRepository.count();

        // ── Revenue ─────────────────────────────────────────────────────────
        BigDecimal totalRevenue   = paymentRepository.sumPaidRevenue();
        BigDecimal pendingRevenue = paymentRepository.sumPendingRevenue();
        if (totalRevenue   == null) totalRevenue   = BigDecimal.ZERO;
        if (pendingRevenue == null) pendingRevenue = BigDecimal.ZERO;

        // ── Monthly stats (last 6 months) ────────────────────────────────────
        LocalDateTime since = LocalDateTime.now().minusMonths(6).withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Object[]> revRows  = paymentRepository.monthlyRevenue(since);
        List<Object[]> enrRows  = batchStudentRepository.monthlyEnrollments(since);

        // Build maps keyed by "yyyy-MM" for easy look-up
        Map<String, BigDecimal> revMap = new LinkedHashMap<>();
        for (Object[] row : revRows) {
            int yr  = ((Number) row[0]).intValue();
            int mo  = ((Number) row[1]).intValue();
            BigDecimal total = (BigDecimal) row[2];
            revMap.put(yr + "-" + String.format("%02d", mo), total);
        }

        Map<String, Long> enrMap = new LinkedHashMap<>();
        for (Object[] row : enrRows) {
            int yr   = ((Number) row[0]).intValue();
            int mo   = ((Number) row[1]).intValue();
            long cnt = ((Number) row[2]).longValue();
            enrMap.put(yr + "-" + String.format("%02d", mo), cnt);
        }

        // Generate the last 6 calendar months (oldest → newest)
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<AnalyticsResponse.MonthlyStats> recentMonths = new ArrayList<>();
        LocalDateTime cursor = since;
        for (int i = 0; i < 6; i++) {
            String key   = cursor.getYear() + "-" + String.format("%02d", cursor.getMonthValue());
            String label = cursor.format(labelFmt);
            BigDecimal rev = revMap.getOrDefault(key, BigDecimal.ZERO);
            long       enr = enrMap.getOrDefault(key, 0L);
            recentMonths.add(new AnalyticsResponse.MonthlyStats(label, rev, enr));
            cursor = cursor.plusMonths(1);
        }

        // ── Batch occupancy (ACTIVE batches) ─────────────────────────────────
        List<Batch> active = batchRepository.findByStatusOrderByStartDateDesc("ACTIVE");
        List<AnalyticsResponse.BatchOccupancy> batchOccupancy = new ArrayList<>();
        for (Batch b : active) {
            long enrolled   = batchStudentRepository.countByBatchId(b.getId());
            int  maxStudents = b.getMaxStudents();
            int  pct         = maxStudents > 0 ? (int) Math.round((enrolled * 100.0) / maxStudents) : 0;
            batchOccupancy.add(new AnalyticsResponse.BatchOccupancy(
                    b.getId(), b.getName(), enrolled, maxStudents, pct));
        }

        return new AnalyticsResponse(
                totalStudents, totalTeachers, totalBatches, activeBatches,
                totalRevenue, pendingRevenue, totalEnrollments,
                recentMonths, batchOccupancy);
    }
}
