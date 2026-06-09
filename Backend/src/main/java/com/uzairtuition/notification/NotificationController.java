package com.uzairtuition.notification;

import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private Long resolveUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."))
                .getId();
    }

    @GetMapping
    public List<NotificationResponse> get(Principal principal) {
        return notificationService.getForUser(resolveUserId(principal));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Principal principal) {
        return notificationService.getUnreadCount(resolveUserId(principal));
    }

    @PutMapping("/{id}/read")
    public void markRead(@PathVariable Long id, Principal principal) {
        notificationService.markRead(id, resolveUserId(principal));
    }

    @PutMapping("/read-all")
    public void markAllRead(Principal principal) {
        notificationService.markAllRead(resolveUserId(principal));
    }
}
