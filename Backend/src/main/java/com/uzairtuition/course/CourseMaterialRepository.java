package com.uzairtuition.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {
    List<CourseMaterial> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    long countByCourseId(Long courseId);
}
