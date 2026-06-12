package com.uzairtuition.support;

import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional
    public TicketResponse createTicket(String subject, String message, String userEmail) {
        User user = findUser(userEmail);
        SupportTicket ticket = ticketRepository.save(
                SupportTicket.builder().subject(subject).student(user).status("OPEN").build());
        messageRepository.save(
                SupportMessage.builder().ticket(ticket).sender(user).message(message).build());

        userRepository.findByRoleName("ADMIN").forEach(admin ->
                notificationService.createForUser(admin, "SUPPORT_TICKET_CREATED",
                        "New Support Ticket",
                        user.getFirstName() + " " + user.getLastName() + ": " + subject,
                        ticket.getId()));

        return toTicketResponse(ticket, 1L);
    }

    @Transactional
    public MessageResponse addMessage(Long ticketId, String message, String senderEmail) {
        User sender = findUser(senderEmail);
        SupportTicket ticket = findTicket(ticketId);
        boolean senderIsAdmin = isAdmin(sender);

        if (!senderIsAdmin && !ticket.getStudent().getId().equals(sender.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }

        if ("CLOSED".equals(ticket.getStatus()) && !senderIsAdmin) {
            ticket.setStatus("IN_PROGRESS");
            ticketRepository.save(ticket);
        }

        SupportMessage saved = messageRepository.save(
                SupportMessage.builder().ticket(ticket).sender(sender).message(message).build());

        if (senderIsAdmin) {
            notificationService.createForUser(ticket.getStudent(), "SUPPORT_REPLY",
                    "Reply on: " + ticket.getSubject(),
                    message.length() > 80 ? message.substring(0, 80) + "…" : message,
                    ticket.getId());
        } else {
            userRepository.findByRoleName("ADMIN").forEach(admin ->
                    notificationService.createForUser(admin, "SUPPORT_TICKET_CREATED",
                            "Reply on Support Ticket",
                            sender.getFirstName() + " " + sender.getLastName() + " replied: " + ticket.getSubject(),
                            ticket.getId()));
        }

        return toMessageResponse(saved, senderIsAdmin);
    }

    @Transactional
    public TicketResponse updateStatus(Long ticketId, String status) {
        SupportTicket ticket = findTicket(ticketId);
        ticket.setStatus(status.toUpperCase());
        ticketRepository.save(ticket);
        long count = messageRepository.countByTicketId(ticketId);
        return toTicketResponse(ticket, count);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getStudentTickets(String email) {
        User user = findUser(email);
        return ticketRepository.findByStudentIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(t -> toTicketResponse(t, messageRepository.countByTicketId(t.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(t -> toTicketResponse(t, messageRepository.countByTicketId(t.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ThreadResponse getThread(Long ticketId, String email) {
        User user = findUser(email);
        SupportTicket ticket = findTicket(ticketId);
        if (!isAdmin(user) && !ticket.getStudent().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        List<SupportMessage> messages = messageRepository.findByTicketIdOrderBySentAtAsc(ticketId);
        long count = messages.size();
        List<MessageResponse> msgResponses = messages.stream()
                .map(m -> toMessageResponse(m, isAdmin(m.getSender())))
                .toList();
        return new ThreadResponse(toTicketResponse(ticket, count), msgResponses);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private SupportTicket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
    }

    private TicketResponse toTicketResponse(SupportTicket t, long messageCount) {
        String studentName = t.getStudent().getFirstName() + " " + t.getStudent().getLastName();
        return new TicketResponse(
                t.getId(), t.getSubject(), t.getStatus(), studentName, messageCount,
                t.getCreatedAt() != null ? t.getCreatedAt().format(FMT) : null,
                t.getUpdatedAt() != null ? t.getUpdatedAt().format(FMT) : null);
    }

    private MessageResponse toMessageResponse(SupportMessage m, boolean adminSender) {
        String senderName = m.getSender().getFirstName() + " " + m.getSender().getLastName();
        return new MessageResponse(
                m.getId(), m.getSender().getId(), senderName,
                m.getMessage(),
                m.getSentAt() != null ? m.getSentAt().format(FMT) : null,
                adminSender);
    }
}
