package com.uzairtuition.course;

import java.time.LocalDateTime;

public record CourseResponse(
        Long id,
        String title,
        String description,
        String duration,
        String thumbnailUrl,
        String status,
        String createdByName,
        long materialCount,
        LocalDateTime createdAt
) {
    public static CourseResponse from(Course course, long materialCount) {
        String createdByName = course.getCreatedBy() != null
                ? course.getCreatedBy().getFirstName() + " " + course.getCreatedBy().getLastName()
                : null;
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getDuration(),
                course.getThumbnailUrl(),
                course.getStatus(),
                createdByName,
                materialCount,
                course.getCreatedAt()
        );
    }
}
