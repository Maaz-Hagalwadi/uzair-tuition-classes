package com.uzairtuition.announcement;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EmailService;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest req, String authorEmail) {
        User author = EntityFinder.findOrThrow(userRepository.findByEmail(authorEmail), "User");

        Batch batch = null;
        if (req.batchId() != null) {
            batch = EntityFinder.findOrThrow(batchRepository.findById(req.batchId()), "Batch");
        }

        Announcement a = Announcement.builder()
                .title(req.title().trim())
                .content(req.content().trim())
                .publishedBy(author)
                .batch(batch)
                .build();

        AnnouncementResponse response = AnnouncementResponse.from(announcementRepository.save(a));

        if (batch != null) {
            final String batchName = batch.getName();
            batchStudentRepository.findByBatchIdOrderByEnrolledAtDesc(batch.getId())
                    .forEach(bs -> {
                        notificationService.createForUser(
                                bs.getStudent(), "NEW_ANNOUNCEMENT",
                                "New Announcement: " + a.getTitle(),
                                a.getContent().length() > 120 ? a.getContent().substring(0, 120) + "…" : a.getContent(),
                                a.getId()
                        );
                        emailService.sendAnnouncementEmail(
                                bs.getStudent().getEmail(), bs.getStudent().getFirstName(),
                                a.getTitle(), a.getContent(), batchName
                        );
                    });
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getBatchAnnouncements(Long batchId) {
        return announcementRepository.findByBatchIdOrderByCreatedAtDesc(batchId)
                .stream()
                .map(AnnouncementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AnnouncementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getStudentAnnouncements(Long studentId) {
        List<Long> batchIds = batchRepository.findByStudentId(studentId)
                .stream()
                .map(Batch::getId)
                .toList();

        List<Announcement> forBatches = batchIds.isEmpty()
                ? List.of()
                : announcementRepository.findByBatchIdInOrderByCreatedAtDesc(batchIds);

        List<Announcement> siteWide = announcementRepository.findByBatchIsNullOrderByCreatedAtDesc();

        List<Announcement> all = new ArrayList<>();
        all.addAll(forBatches);
        all.addAll(siteWide);
        all.sort((x, y) -> y.getCreatedAt().compareTo(x.getCreatedAt()));

        return all.stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found.");
        }
        announcementRepository.deleteById(id);
    }
}
