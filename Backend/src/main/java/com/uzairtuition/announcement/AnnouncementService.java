package com.uzairtuition.announcement;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
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
    private final UserRepository userRepository;

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest req, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        Batch batch = null;
        if (req.batchId() != null) {
            batch = batchRepository.findById(req.batchId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found."));
        }

        Announcement a = Announcement.builder()
                .title(req.title().trim())
                .content(req.content().trim())
                .publishedBy(author)
                .batch(batch)
                .build();

        return AnnouncementResponse.from(announcementRepository.save(a));
    }

    public List<AnnouncementResponse> getBatchAnnouncements(Long batchId) {
        return announcementRepository.findByBatchIdOrderByCreatedAtDesc(batchId)
                .stream()
                .map(AnnouncementResponse::from)
                .toList();
    }

    public List<AnnouncementResponse> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AnnouncementResponse::from)
                .toList();
    }

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
