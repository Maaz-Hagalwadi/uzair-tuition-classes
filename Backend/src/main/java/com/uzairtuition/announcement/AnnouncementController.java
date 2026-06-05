package com.uzairtuition.announcement;

import com.uzairtuition.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher + Admin endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/api/teacher/announcements")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementResponse create(@Valid @RequestBody AnnouncementRequest req, Principal principal) {
        return announcementService.create(req, principal.getName());
    }

    @GetMapping("/api/teacher/batches/{batchId}/announcements")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public List<AnnouncementResponse> getBatchAnnouncements(@PathVariable Long batchId) {
        return announcementService.getBatchAnnouncements(batchId);
    }

    @DeleteMapping("/api/teacher/announcements/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAsTeacher(@PathVariable Long id) {
        announcementService.delete(id);
    }

    // -------------------------------------------------------------------------
    // Admin-only endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AnnouncementResponse> getAll() {
        return announcementService.getAll();
    }

    @DeleteMapping("/api/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAsAdmin(@PathVariable Long id) {
        announcementService.delete(id);
    }

    // -------------------------------------------------------------------------
    // Student endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/student/announcements")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AnnouncementResponse> getStudentAnnouncements(Principal principal) {
        var user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."));
        return announcementService.getStudentAnnouncements(user.getId());
    }
}
