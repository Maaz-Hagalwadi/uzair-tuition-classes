package com.uzairtuition.admin;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsResponse {

    private long totalStudents;
    private long totalTeachers;
    private long totalBatches;
    private long activeBatches;
    private BigDecimal totalRevenue;
    private BigDecimal pendingRevenue;
    private long totalEnrollments;
    private List<MonthlyStats> recentMonths;
    private List<BatchOccupancy> batchOccupancy;

    public AnalyticsResponse() {}

    public AnalyticsResponse(long totalStudents, long totalTeachers, long totalBatches,
                             long activeBatches, BigDecimal totalRevenue, BigDecimal pendingRevenue,
                             long totalEnrollments, List<MonthlyStats> recentMonths,
                             List<BatchOccupancy> batchOccupancy) {
        this.totalStudents = totalStudents;
        this.totalTeachers = totalTeachers;
        this.totalBatches = totalBatches;
        this.activeBatches = activeBatches;
        this.totalRevenue = totalRevenue;
        this.pendingRevenue = pendingRevenue;
        this.totalEnrollments = totalEnrollments;
        this.recentMonths = recentMonths;
        this.batchOccupancy = batchOccupancy;
    }

    public long getTotalStudents() { return totalStudents; }
    public long getTotalTeachers() { return totalTeachers; }
    public long getTotalBatches() { return totalBatches; }
    public long getActiveBatches() { return activeBatches; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public BigDecimal getPendingRevenue() { return pendingRevenue; }
    public long getTotalEnrollments() { return totalEnrollments; }
    public List<MonthlyStats> getRecentMonths() { return recentMonths; }
    public List<BatchOccupancy> getBatchOccupancy() { return batchOccupancy; }

    // ── Nested types ────────────────────────────────────────────────────────────

    public static class MonthlyStats {
        private String month;
        private BigDecimal revenue;
        private long enrollments;

        public MonthlyStats() {}

        public MonthlyStats(String month, BigDecimal revenue, long enrollments) {
            this.month = month;
            this.revenue = revenue;
            this.enrollments = enrollments;
        }

        public String getMonth() { return month; }
        public BigDecimal getRevenue() { return revenue; }
        public long getEnrollments() { return enrollments; }
    }

    public static class BatchOccupancy {
        private Long batchId;
        private String batchName;
        private long enrolled;
        private int maxStudents;
        private int pct;

        public BatchOccupancy() {}

        public BatchOccupancy(Long batchId, String batchName, long enrolled, int maxStudents, int pct) {
            this.batchId = batchId;
            this.batchName = batchName;
            this.enrolled = enrolled;
            this.maxStudents = maxStudents;
            this.pct = pct;
        }

        public Long getBatchId() { return batchId; }
        public String getBatchName() { return batchName; }
        public long getEnrolled() { return enrolled; }
        public int getMaxStudents() { return maxStudents; }
        public int getPct() { return pct; }
    }
}
