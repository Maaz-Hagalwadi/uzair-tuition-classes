package com.uzairtuition.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findBySessionId(Long sessionId);
    List<Attendance> findByStudentId(Long studentId);
    Optional<Attendance> findBySessionIdAndStudentId(Long sessionId, Long studentId);
    long countBySessionIdAndStatus(Long sessionId, String status);
}
