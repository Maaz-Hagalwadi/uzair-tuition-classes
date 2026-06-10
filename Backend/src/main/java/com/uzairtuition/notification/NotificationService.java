package com.uzairtuition.notification;

import com.uzairtuition.user.User;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createForUser(User user, String type, String title, String message, Long relatedId) {
        notificationRepository.save(
                Notification.builder()
                        .user(user)
                        .type(type)
                        .title(title)
                        .message(message)
                        .relatedId(relatedId)
                        .build()
        );
    }

    public List<NotificationResponse> getForUser(Long userId) {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationResponse::from).toList();
    }

    public Map<String, Long> getUnreadCount(Long userId) {
        return Map.of("count", notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = EntityFinder.findOrThrow(notificationRepository.findById(notificationId), "Notification");
        if (!n.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }
}
