package com.uzairtuition.batch;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BatchResponse(
        Long id,
        String name,
        Long courseId,
        String courseName,
        Long teacherId,
        String teacherName,
        LocalDate startDate,
        LocalDate endDate,
        String timings,
        int maxStudents,
        String status,
        long studentCount,
        LocalDateTime createdAt
) {
    public static BatchResponse from(Batch batch, long studentCount) {
        String teacherName = batch.getTeacher() != null
                ? batch.getTeacher().getFirstName() + " " + batch.getTeacher().getLastName()
                : null;
        Long teacherId = batch.getTeacher() != null ? batch.getTeacher().getId() : null;
        return new BatchResponse(
                batch.getId(),
                batch.getName(),
                batch.getCourse().getId(),
                batch.getCourse().getTitle(),
                teacherId,
                teacherName,
                batch.getStartDate(),
                batch.getEndDate(),
                batch.getTimings(),
                batch.getMaxStudents(),
                batch.getStatus(),
                studentCount,
                batch.getCreatedAt()
        );
    }
}
