package com.uzairtuition.attendance;

public record StudentAttendanceSummary(
        Long batchId,
        String batchName,
        int totalSessions,
        int present,
        int late,
        int absent,
        int percentage   // (present + late) / totalSessions * 100, 0 if totalSessions == 0
) {}
