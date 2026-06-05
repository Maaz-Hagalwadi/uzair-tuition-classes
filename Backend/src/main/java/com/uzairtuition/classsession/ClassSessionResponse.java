package com.uzairtuition.classsession;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ClassSessionResponse(
        Long id,
        Long batchId,
        String batchName,
        String courseName,
        String title,
        LocalDate sessionDate,
        LocalTime startTime,
        LocalTime endTime,
        String meetingUrl,
        String meetingPlatform,
        String createdByName,
        LocalDateTime createdAt
) {
    public static ClassSessionResponse from(ClassSession s) {
        String createdByName = s.getCreatedBy() != null
                ? s.getCreatedBy().getFirstName() + " " + s.getCreatedBy().getLastName()
                : null;
        return new ClassSessionResponse(
                s.getId(),
                s.getBatch().getId(),
                s.getBatch().getName(),
                s.getBatch().getCourse().getTitle(),
                s.getTitle(),
                s.getSessionDate(),
                s.getStartTime(),
                s.getEndTime(),
                s.getMeetingUrl(),
                s.getMeetingPlatform(),
                createdByName,
                s.getCreatedAt()
        );
    }
}
