package com.uzairtuition.course;

import java.time.LocalDateTime;

public record CourseMaterialResponse(
        Long id,
        Long courseId,
        String title,
        String fileUrl,
        String fileType,
        String uploadedByName,
        LocalDateTime createdAt
) {
    public static CourseMaterialResponse from(CourseMaterial m) {
        String uploadedByName = m.getUploadedBy() != null
                ? m.getUploadedBy().getFirstName() + " " + m.getUploadedBy().getLastName()
                : null;
        return new CourseMaterialResponse(
                m.getId(),
                m.getCourse().getId(),
                m.getTitle(),
                m.getFileUrl(),
                m.getFileType(),
                uploadedByName,
                m.getCreatedAt()
        );
    }
}
