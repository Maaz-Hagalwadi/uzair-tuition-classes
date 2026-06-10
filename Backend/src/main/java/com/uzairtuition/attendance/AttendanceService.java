package com.uzairtuition.attendance;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.classsession.ClassSession;
import com.uzairtuition.classsession.ClassSessionRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
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
    private final BatchRepository batchRepository;

    private static final Set<String> VALID_STATUSES = Set.of("PRESENT", "ABSENT", "LATE");

    public List<AttendanceResponse> getSessionAttendance(Long sessionId) {
        return attendanceRepository.findBySessionId(sessionId)
                .stream().map(AttendanceResponse::from).toList();
    }

    @Transactional
    public List<AttendanceResponse> markAttendance(Long sessionId, AttendanceBulkRequest req, String markerEmail) {
        ClassSession session = EntityFinder.findOrThrow(classSessionRepository.findById(sessionId), "Session");
        User marker = EntityFinder.findOrThrow(userRepository.findByEmail(markerEmail), "User");

        List<Attendance> saved = new ArrayList<>();
        for (AttendanceEntry entry : req.entries()) {
            String status = entry.status().toUpperCase();
            if (!VALID_STATUSES.contains(status))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + entry.status());

            User student = EntityFinder.findOrThrow(userRepository.findById(entry.studentId()), "Student");

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

    public List<AttendanceResponse> getStudentAttendance(Long studentId) {
        return attendanceRepository.findByStudentId(studentId)
                .stream().map(AttendanceResponse::from).toList();
    }

    public List<StudentAttendanceSummary> getStudentSummary(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);

        return records.stream()
                .collect(Collectors.groupingBy(a -> a.getSession().getBatch().getId()))
                .entrySet().stream()
                .map(e -> buildBatchSummary(e.getKey(), e.getValue()))
                .toList();
    }

    public List<StudentAttendanceSummary> getAllBatchSummaries() {
        List<Batch> batches = batchRepository.findAll();
        List<StudentAttendanceSummary> summaries = new ArrayList<>();
        for (Batch batch : batches) {
            List<ClassSession> sessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batch.getId());
            int totalSessions = sessions.size();
            if (totalSessions == 0) continue;
            List<Attendance> records = sessions.stream()
                    .flatMap(s -> attendanceRepository.findBySessionId(s.getId()).stream())
                    .toList();
            long present = records.stream().filter(a -> "PRESENT".equals(a.getStatus())).count();
            long late    = records.stream().filter(a -> "LATE".equals(a.getStatus())).count();
            long absent  = records.stream().filter(a -> "ABSENT".equals(a.getStatus())).count();
            int pct = (int) Math.round((present + late) * 100.0 / totalSessions);
            summaries.add(new StudentAttendanceSummary(
                    batch.getId(), batch.getName(), totalSessions,
                    (int) present, (int) late, (int) absent, pct
            ));
        }
        summaries.sort((a, b) -> b.percentage() - a.percentage());
        return summaries;
    }

    public List<AttendanceResponse> getBatchAttendance(Long batchId) {
        List<ClassSession> sessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batchId);
        return sessions.stream()
                .flatMap(s -> attendanceRepository.findBySessionId(s.getId()).stream())
                .map(AttendanceResponse::from)
                .toList();
    }

    private StudentAttendanceSummary buildBatchSummary(Long batchId, List<Attendance> batchRecords) {
        String batchName = batchRecords.get(0).getSession().getBatch().getName();
        int totalSessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batchId).size();
        long presentCount = batchRecords.stream().filter(a -> "PRESENT".equals(a.getStatus())).count();
        long lateCount    = batchRecords.stream().filter(a -> "LATE".equals(a.getStatus())).count();
        long absentCount  = batchRecords.stream().filter(a -> "ABSENT".equals(a.getStatus())).count();
        int pct = totalSessions > 0 ? (int) Math.round((presentCount + lateCount) * 100.0 / totalSessions) : 0;
        return new StudentAttendanceSummary(
                batchId, batchName, totalSessions,
                (int) presentCount, (int) lateCount, (int) absentCount, pct
        );
    }
}
