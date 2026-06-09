package com.uzairtuition.attendance;

import com.uzairtuition.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    // Teacher + Admin: get session attendance
    @GetMapping("/api/teacher/sessions/{sessionId}/attendance")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public List<AttendanceResponse> getSessionAttendance(@PathVariable Long sessionId) {
        return attendanceService.getSessionAttendance(sessionId);
    }

    // Teacher + Admin: bulk mark / upsert attendance for a session
    @PostMapping("/api/teacher/sessions/{sessionId}/attendance")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.OK)
    public List<AttendanceResponse> markAttendance(
            @PathVariable Long sessionId,
            @Valid @RequestBody AttendanceBulkRequest req,
            Principal principal) {
        return attendanceService.markAttendance(sessionId, req, principal.getName());
    }

    // Student: get own attendance history
    @GetMapping("/api/student/attendance")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AttendanceResponse> getStudentAttendance(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return attendanceService.getStudentAttendance(user.getId());
    }

    // Student: get per-batch attendance summary
    @GetMapping("/api/student/attendance/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentAttendanceSummary> getStudentSummary(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return attendanceService.getStudentSummary(user.getId());
    }

    // Admin: batch-level attendance report
    @GetMapping("/api/admin/batches/{batchId}/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AttendanceResponse> getBatchAttendance(@PathVariable Long batchId) {
        return attendanceService.getBatchAttendance(batchId);
    }

    // Admin: all-batches attendance summary for reports
    @GetMapping("/api/admin/attendance/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public List<StudentAttendanceSummary> getAllBatchSummaries() {
        return attendanceService.getAllBatchSummaries();
    }
}
