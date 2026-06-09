package com.uzairtuition.batch;

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
public class BatchController {

    private final BatchService batchService;
    private final UserRepository userRepository;

    // Public — for landing page
    @GetMapping("/api/public/batches")
    public List<BatchResponse> publicList() {
        return batchService.getUpcomingAndActiveBatches();
    }

    // Admin
    @GetMapping("/api/admin/batches")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BatchResponse> list(@RequestParam(required = false) String status) {
        return batchService.getAllBatches(status);
    }

    @GetMapping("/api/admin/batches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BatchResponse get(@PathVariable Long id) {
        return batchService.getBatch(id);
    }

    @PostMapping("/api/admin/batches")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponse create(@Valid @RequestBody BatchRequest req) {
        return batchService.createBatch(req);
    }

    @PutMapping("/api/admin/batches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BatchResponse update(@PathVariable Long id, @Valid @RequestBody BatchRequest req) {
        return batchService.updateBatch(id, req);
    }

    @DeleteMapping("/api/admin/batches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        batchService.deleteBatch(id);
    }

    @GetMapping("/api/admin/batches/{id}/students")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BatchStudentResponse> getStudents(@PathVariable Long id) {
        return batchService.getStudents(id);
    }

    @PostMapping("/api/admin/batches/{id}/students")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchStudentResponse enroll(@PathVariable Long id, @RequestParam Long studentId) {
        return batchService.enrollStudent(id, studentId);
    }

    @DeleteMapping("/api/admin/batches/{id}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeStudent(@PathVariable Long id, @PathVariable Long studentId) {
        batchService.removeStudent(id, studentId);
    }

    // Teacher
    @GetMapping("/api/teacher/batches")
    @PreAuthorize("hasRole('TEACHER')")
    public List<BatchResponse> teacherBatches(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return batchService.getTeacherBatches(user.getId());
    }

    @GetMapping("/api/teacher/batches/{id}/students")
    @PreAuthorize("hasRole('TEACHER')")
    public List<BatchStudentResponse> teacherBatchStudents(@PathVariable Long id) {
        return batchService.getStudents(id);
    }

    // Student
    @GetMapping("/api/student/batches")
    @PreAuthorize("hasRole('STUDENT')")
    public List<BatchResponse> studentBatches(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return batchService.getStudentBatches(user.getId());
    }

    @GetMapping("/api/student/batches/browse")
    @PreAuthorize("hasRole('STUDENT')")
    public List<BatchBrowseResponse> browseBatches(Principal principal) {
        return batchService.browseBatches(principal.getName());
    }
}
