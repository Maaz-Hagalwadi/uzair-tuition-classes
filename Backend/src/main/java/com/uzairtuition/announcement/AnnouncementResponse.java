package com.uzairtuition.announcement;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String content,
        Long batchId,
        String batchName,
        String publishedByName,
        LocalDateTime createdAt
) {
    public static AnnouncementResponse from(Announcement a) {
        Long batchId = a.getBatch() != null ? a.getBatch().getId() : null;
        String batchName = a.getBatch() != null ? a.getBatch().getName() : null;

        String publishedByName = null;
        if (a.getPublishedBy() != null) {
            publishedByName = a.getPublishedBy().getFirstName() + " " + a.getPublishedBy().getLastName();
        }

        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getContent(),
                batchId,
                batchName,
                publishedByName,
                a.getCreatedAt()
        );
    }
}
