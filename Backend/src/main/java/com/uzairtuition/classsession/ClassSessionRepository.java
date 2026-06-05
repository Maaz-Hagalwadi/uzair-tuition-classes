package com.uzairtuition.classsession;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {
    List<ClassSession> findByBatchIdOrderBySessionDateAscStartTimeAsc(Long batchId);
    List<ClassSession> findByBatchIdOrderBySessionDateDesc(Long batchId);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.batch.id = :batchId AND cs.sessionDate >= :from ORDER BY cs.sessionDate ASC, cs.startTime ASC")
    List<ClassSession> findUpcoming(Long batchId, LocalDate from);

    @Query("""
        SELECT cs FROM ClassSession cs
        WHERE cs.batch.id IN (
            SELECT bs.batch.id FROM BatchStudent bs WHERE bs.student.id = :studentId
        )
        AND cs.sessionDate >= :from
        ORDER BY cs.sessionDate ASC, cs.startTime ASC
        """)
    List<ClassSession> findUpcomingForStudent(Long studentId, LocalDate from);

    @Query("""
        SELECT cs FROM ClassSession cs
        WHERE cs.batch.teacher.id = :teacherId
        AND cs.sessionDate >= :from
        ORDER BY cs.sessionDate ASC, cs.startTime ASC
        """)
    List<ClassSession> findUpcomingForTeacher(Long teacherId, LocalDate from);
}
