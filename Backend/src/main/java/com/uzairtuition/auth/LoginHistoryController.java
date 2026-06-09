package com.uzairtuition.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class LoginHistoryController {

    private final LoginHistoryRepository loginHistoryRepository;

    @GetMapping("/api/admin/login-history")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getLoginHistory() {
        return loginHistoryRepository.findTop100ByOrderByLoggedInAtDesc()
                .stream()
                .map(this::toMap)
                .toList();
    }

    @GetMapping("/api/admin/login-history/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getUserLoginHistory(@PathVariable Long userId) {
        return loginHistoryRepository.findByUserIdOrderByLoggedInAtDesc(userId)
                .stream()
                .map(this::toMap)
                .toList();
    }

    private Map<String, Object> toMap(LoginHistory h) {
        var user = h.getUser();
        return Map.of(
            "id",          h.getId(),
            "userId",      user.getId(),
            "userName",    user.getFirstName() + " " + user.getLastName(),
            "userEmail",   user.getEmail(),
            "ipAddress",   h.getIpAddress()  != null ? h.getIpAddress()  : "",
            "browser",     h.getBrowser()    != null ? h.getBrowser()    : "Unknown",
            "os",          h.getOs()         != null ? h.getOs()         : "Unknown",
            "device",      h.getDevice()     != null ? h.getDevice()     : "Unknown",
            "loggedInAt",  h.getLoggedInAt() != null ? h.getLoggedInAt() : LocalDateTime.now()
        );
    }
}
