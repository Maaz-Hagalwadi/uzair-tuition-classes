package com.uzairtuition.announcement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByBatchIdOrderByCreatedAtDesc(Long batchId);

    List<Announcement> findByBatchIdInOrderByCreatedAtDesc(List<Long> batchIds);

    List<Announcement> findByBatchIsNullOrderByCreatedAtDesc();
}
