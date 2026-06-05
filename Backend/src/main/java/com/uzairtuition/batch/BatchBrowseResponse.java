package com.uzairtuition.batch;

import java.time.LocalDate;

public record BatchBrowseResponse(
        Long id,
        String name,
        Long courseId,
        String courseName,
        String teacherName,
        LocalDate startDate,
        LocalDate endDate,
        String timings,
        int maxStudents,
        long studentCount,
        String status,
        boolean enrolled,
        String requestStatus
) {
    public static BatchBrowseResponse from(Batch b, long studentCount, boolean enrolled, String requestStatus) {
        return new BatchBrowseResponse(
                b.getId(),
                b.getName(),
                b.getCourse().getId(),
                b.getCourse().getTitle(),
                b.getTeacher() != null ? b.getTeacher().getFirstName() + " " + b.getTeacher().getLastName() : null,
                b.getStartDate(),
                b.getEndDate(),
                b.getTimings(),
                b.getMaxStudents(),
                studentCount,
                b.getStatus(),
                enrolled,
                requestStatus
        );
    }
}
