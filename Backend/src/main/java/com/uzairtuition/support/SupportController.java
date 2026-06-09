package com.uzairtuition.support;

import com.uzairtuition.lead.Lead;
import com.uzairtuition.lead.LeadRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    @PostMapping("/message")
    public ResponseEntity<Map<String, String>> submitMessage(
            Principal principal,
            @Valid @RequestBody SupportMessageRequest req) {

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        Lead lead = Lead.builder()
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone() != null ? user.getPhone() : "—")
                .interestedCourse("[Support] " + req.subject())
                .message(req.message())
                .status("NEW")
                .build();
        Lead saved = leadRepository.save(lead);

        userRepository.findByRoleName("ADMIN")
                .forEach(admin -> notificationService.createForUser(
                        admin, "NEW_LEAD",
                        "Support Request: " + req.subject(),
                        user.getFirstName() + " " + user.getLastName() + " submitted a support request.",
                        saved.getId()
                ));

        return ResponseEntity.ok(Map.of("message", "Message sent successfully."));
    }
}
