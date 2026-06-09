package com.uzairtuition.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        boolean read,
        Long relatedId,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.isRead(), n.getRelatedId(), n.getCreatedAt()
        );
    }
}
