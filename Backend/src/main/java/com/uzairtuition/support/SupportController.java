package com.uzairtuition.support;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    // ── Student / Teacher ─────────────────────────────────────────────────────

    @PostMapping("/api/support/tickets")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    public TicketResponse createTicket(@Valid @RequestBody TicketRequest req, Principal principal) {
        return supportService.createTicket(req.subject(), req.message(), principal.getName());
    }

    @GetMapping("/api/support/tickets")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    public List<TicketResponse> getMyTickets(Principal principal) {
        return supportService.getStudentTickets(principal.getName());
    }

    @GetMapping("/api/support/tickets/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
    public ThreadResponse getThread(@PathVariable Long id, Principal principal) {
        return supportService.getThread(id, principal.getName());
    }

    @PostMapping("/api/support/tickets/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
    public MessageResponse addMessage(@PathVariable Long id,
                                      @Valid @RequestBody MessageRequest req,
                                      Principal principal) {
        return supportService.addMessage(id, req.message(), principal.getName());
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/support/tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TicketResponse> getAllTickets() {
        return supportService.getAllTickets();
    }

    @PutMapping("/api/admin/support/tickets/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse updateStatus(@PathVariable Long id,
                                       @RequestBody Map<String, String> body) {
        return supportService.updateStatus(id, body.getOrDefault("status", "OPEN"));
    }
}
