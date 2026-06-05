package com.uzairtuition.enrollment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    // Student
    @PostMapping("/api/student/batches/{id}/request")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentRequestResponse requestEnrollment(@PathVariable Long id, Principal principal) {
        return enrollmentService.requestEnrollment(id, principal.getName());
    }

    @GetMapping("/api/student/enrollment-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public List<EnrollmentRequestResponse> myRequests(Principal principal) {
        return enrollmentService.getStudentRequests(principal.getName());
    }

    // Admin
    @GetMapping("/api/admin/enrollment-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EnrollmentRequestResponse> allRequests(@RequestParam(required = false) String status) {
        return enrollmentService.getAllRequests(status);
    }

    @GetMapping("/api/admin/enrollment-requests/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> pendingCount() {
        return Map.of("count", enrollmentService.countPending());
    }

    @PostMapping("/api/admin/enrollment-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public EnrollmentRequestResponse approve(@PathVariable Long id) {
        return enrollmentService.approve(id);
    }

    @PostMapping("/api/admin/enrollment-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public EnrollmentRequestResponse reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest body) {
        return enrollmentService.reject(id, body != null ? body.note() : null);
    }
}
