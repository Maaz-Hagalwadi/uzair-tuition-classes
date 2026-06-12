package com.uzairtuition.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByTicketIdOrderBySentAtAsc(Long ticketId);
    long countByTicketId(Long ticketId);
}
