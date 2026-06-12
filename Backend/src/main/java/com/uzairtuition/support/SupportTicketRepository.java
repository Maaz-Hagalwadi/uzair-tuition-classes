package com.uzairtuition.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByStudentIdOrderByUpdatedAtDesc(Long studentId);
    List<SupportTicket> findAllByOrderByUpdatedAtDesc();
}
