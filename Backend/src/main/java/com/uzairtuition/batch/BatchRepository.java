package com.uzairtuition.batch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findAllByOrderByStartDateDesc();
    List<Batch> findByStatusOrderByStartDateDesc(String status);
    List<Batch> findByStatusInOrderByStartDateDesc(List<String> statuses);

    @Query("SELECT b FROM Batch b WHERE b.teacher.id = :teacherId ORDER BY b.startDate DESC")
    List<Batch> findByTeacherId(Long teacherId);

    @Query("SELECT bs.batch FROM BatchStudent bs WHERE bs.student.id = :studentId ORDER BY bs.batch.startDate DESC")
    List<Batch> findByStudentId(Long studentId);
}
