package com.uzairtuition.lead;

import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeadService {

    private static final Set<String> VALID_STATUSES = Set.of("NEW", "CONTACTED", "ENROLLED", "CLOSED");

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public LeadResponse submitLead(LeadRequest req) {
        Lead lead = Lead.builder()
                .fullName(req.fullName().trim())
                .email(req.email().trim().toLowerCase())
                .phone(req.phone().trim())
                .interestedCourse(req.interestedCourse())
                .message(req.message())
                .status("NEW")
                .build();
        LeadResponse response = LeadResponse.from(leadRepository.save(lead));

        userRepository.findByRoleName("ADMIN").forEach(admin -> {
            notificationService.createForUser(
                    admin, "NEW_LEAD",
                    "New Enquiry Received",
                    lead.getFullName() + " enquired about "
                            + (lead.getInterestedCourse() != null ? lead.getInterestedCourse() : "a course") + ".",
                    lead.getId()
            );
            emailService.sendNewLeadEmail(
                    admin.getEmail(), lead.getFullName(), lead.getEmail(),
                    lead.getPhone(), lead.getInterestedCourse()
            );
        });

        return response;
    }

    public List<LeadResponse> getLeads(String status) {
        List<Lead> leads = (status != null && !status.isBlank())
                ? leadRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : leadRepository.findAllByOrderByCreatedAtDesc();
        return leads.stream().map(LeadResponse::from).toList();
    }

    public Map<String, Long> getCounts() {
        return Map.of(
                "NEW", leadRepository.countByStatus("NEW"),
                "CONTACTED", leadRepository.countByStatus("CONTACTED"),
                "ENROLLED", leadRepository.countByStatus("ENROLLED"),
                "CLOSED", leadRepository.countByStatus("CLOSED")
        );
    }

    @Transactional
    public LeadResponse updateStatus(Long id, String status) {
        if (!VALID_STATUSES.contains(status.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }
        Lead lead = findOrThrow(id);
        lead.setStatus(status.toUpperCase());
        return LeadResponse.from(leadRepository.save(lead));
    }

    public void deleteLead(Long id) {
        findOrThrow(id);
        leadRepository.deleteById(id);
    }

    private Lead findOrThrow(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found."));
    }
}
