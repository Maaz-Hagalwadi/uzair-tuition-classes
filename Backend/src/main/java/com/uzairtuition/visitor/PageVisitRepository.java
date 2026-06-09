package com.uzairtuition.visitor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface PageVisitRepository extends JpaRepository<PageVisit, Long> {

    List<PageVisit> findTop50ByOrderByVisitedAtDesc();

    long countByVisitedAtAfter(LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT v.ipAddress) FROM PageVisit v WHERE v.visitedAt > :since")
    long countDistinctIpAfter(LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT v.ipAddress) FROM PageVisit v")
    long countDistinctIpAll();
}
