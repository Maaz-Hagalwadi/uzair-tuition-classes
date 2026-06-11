package com.uzairtuition.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findBySessionId(Long sessionId);
    List<Attendance> findByStudentId(Long studentId);
    Optional<Attendance> findBySessionIdAndStudentId(Long sessionId, Long studentId);
    long countBySessionIdAndStatus(Long sessionId, String status);

    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId AND a.session.batch.id = :batchId")
    List<Attendance> findByStudentIdAndBatchId(@Param("studentId") Long studentId, @Param("batchId") Long batchId);
}
