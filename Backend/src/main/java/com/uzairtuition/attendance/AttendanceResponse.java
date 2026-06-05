package com.uzairtuition.attendance;

import java.time.LocalDateTime;

public record AttendanceResponse(
        Long id,
        Long sessionId,
        String sessionTitle,
        String sessionDate,
        Long batchId,
        String batchName,
        Long studentId,
        String studentName,
        String status,
        String notes,
        LocalDateTime markedAt
) {
    public static AttendanceResponse from(Attendance a) {
        return new AttendanceResponse(
                a.getId(),
                a.getSession().getId(),
                a.getSession().getTitle(),
                a.getSession().getSessionDate().toString(),
                a.getSession().getBatch().getId(),
                a.getSession().getBatch().getName(),
                a.getStudent().getId(),
                a.getStudent().getFirstName() + " " + a.getStudent().getLastName(),
                a.getStatus(),
                a.getNotes(),
                a.getMarkedAt()
        );
    }
}
