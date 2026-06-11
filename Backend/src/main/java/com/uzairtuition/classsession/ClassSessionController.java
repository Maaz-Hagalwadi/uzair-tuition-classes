package com.uzairtuition.classsession;

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
public class ClassSessionController {

    private final ClassSessionService sessionService;
    private final UserRepository userRepository;

    // Admin + Teacher — sessions within a batch
    @GetMapping("/api/admin/batches/{batchId}/sessions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public List<ClassSessionResponse> list(@PathVariable Long batchId) {
        return sessionService.getBatchSessions(batchId);
    }

    @PostMapping("/api/admin/batches/{batchId}/sessions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassSessionResponse create(
            Principal principal,
            @PathVariable Long batchId,
            @Valid @RequestBody ClassSessionRequest req) {
        return sessionService.create(batchId, req, principal.getName());
    }

    @PostMapping("/api/admin/batches/{batchId}/sessions/bulk")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public List<ClassSessionResponse> createBulk(
            Principal principal,
            @PathVariable Long batchId,
            @Valid @RequestBody BulkSessionRequest req) {
        return sessionService.createBulk(batchId, req, principal.getName());
    }

    @PutMapping("/api/admin/sessions/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ClassSessionResponse update(@PathVariable Long id, @Valid @RequestBody ClassSessionRequest req) {
        return sessionService.update(id, req);
    }

    @DeleteMapping("/api/admin/sessions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sessionService.delete(id);
    }

    // Teacher — upcoming sessions across all their batches
    @GetMapping("/api/teacher/sessions/upcoming")
    @PreAuthorize("hasRole('TEACHER')")
    public List<ClassSessionResponse> teacherUpcoming(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return sessionService.getUpcomingForTeacher(user.getId());
    }

    // Student — upcoming sessions across all their batches
    @GetMapping("/api/student/sessions/upcoming")
    @PreAuthorize("hasRole('STUDENT')")
    public List<ClassSessionResponse> studentUpcoming(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return sessionService.getUpcomingForStudent(user.getId());
    }
}
