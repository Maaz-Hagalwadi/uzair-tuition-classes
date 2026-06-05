package com.uzairtuition.attendance;

import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.classsession.ClassSession;
import com.uzairtuition.classsession.ClassSessionRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_STATUSES = Set.of("PRESENT", "ABSENT", "LATE");

    // Get all attendance records for a session (returns empty list if none marked yet)
    public List<AttendanceResponse> getSessionAttendance(Long sessionId) {
        return attendanceRepository.findBySessionId(sessionId)
                .stream().map(AttendanceResponse::from).toList();
    }

    // Bulk upsert attendance for a session
    @Transactional
    public List<AttendanceResponse> markAttendance(Long sessionId, AttendanceBulkRequest req, String markerEmail) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found."));
        User marker = userRepository.findByEmail(markerEmail).orElseThrow();

        List<Attendance> saved = new ArrayList<>();
        for (AttendanceEntry entry : req.entries()) {
            String status = entry.status().toUpperCase();
            if (!VALID_STATUSES.contains(status))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + entry.status());

            User student = userRepository.findById(entry.studentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found: " + entry.studentId()));

            // Upsert: update if exists, create if not
            Attendance attendance = attendanceRepository
                    .findBySessionIdAndStudentId(sessionId, entry.studentId())
                    .orElse(Attendance.builder().session(session).student(student).build());

            attendance.setStatus(status);
            attendance.setMarkedBy(marker);
            attendance.setMarkedAt(LocalDateTime.now());
            attendance.setNotes(entry.notes());
            saved.add(attendanceRepository.save(attendance));
        }
        return saved.stream().map(AttendanceResponse::from).toList();
    }

    // All attendance records for a student (raw, for history view)
    public List<AttendanceResponse> getStudentAttendance(Long studentId) {
        return attendanceRepository.findByStudentId(studentId)
                .stream().map(AttendanceResponse::from).toList();
    }

    // Per-batch summary for a student
    public List<StudentAttendanceSummary> getStudentSummary(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);

        // Group by batchId
        Map<Long, List<Attendance>> byBatch = records.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getSession().getBatch().getId()
                ));

        List<StudentAttendanceSummary> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<Attendance>> entry : byBatch.entrySet()) {
            Long batchId = entry.getKey();
            List<Attendance> batchRecords = entry.getValue();
            String batchName = batchRecords.get(0).getSession().getBatch().getName();

            // Total sessions in this batch
            int totalSessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batchId).size();

            long presentCount = batchRecords.stream().filter(a -> "PRESENT".equals(a.getStatus())).count();
            long lateCount    = batchRecords.stream().filter(a -> "LATE".equals(a.getStatus())).count();
            long absentCount  = batchRecords.stream().filter(a -> "ABSENT".equals(a.getStatus())).count();
            int pct = totalSessions > 0 ? (int) Math.round((presentCount + lateCount) * 100.0 / totalSessions) : 0;

            summaries.add(new StudentAttendanceSummary(
                    batchId, batchName, totalSessions,
                    (int) presentCount, (int) lateCount, (int) absentCount, pct
            ));
        }
        return summaries;
    }

    // Batch-level attendance report for admin: all records across all sessions of a batch
    public List<AttendanceResponse> getBatchAttendance(Long batchId) {
        List<ClassSession> sessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batchId);
        return sessions.stream()
                .flatMap(s -> attendanceRepository.findBySessionId(s.getId()).stream())
                .map(AttendanceResponse::from)
                .toList();
    }
}
