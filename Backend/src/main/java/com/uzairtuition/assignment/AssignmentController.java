package com.uzairtuition.assignment;

import com.uzairtuition.assignment.dto.*;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/api/teacher/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentResponse createAssignment(@RequestBody AssignmentRequest req, Principal principal) {
        var teacher = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.createAssignment(req, teacher.getId());
    }

    @GetMapping("/api/teacher/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    public List<AssignmentResponse> getTeacherAssignments(Principal principal) {
        var teacher = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.getTeacherAssignments(teacher.getId());
    }

    @GetMapping("/api/teacher/assignments/{id}/submissions")
    @PreAuthorize("hasRole('TEACHER')")
    public List<SubmissionResponse> getAssignmentSubmissions(@PathVariable Long id, Principal principal) {
        var teacher = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.getAssignmentSubmissions(id, teacher.getId());
    }

    @PostMapping("/api/teacher/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('TEACHER')")
    public SubmissionResponse gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody GradeRequest req,
            Principal principal) {
        var teacher = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.gradeSubmission(submissionId, req, teacher.getId());
    }

    @DeleteMapping("/api/teacher/assignments/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAssignment(@PathVariable Long id, Principal principal) {
        var teacher = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        assignmentService.deleteAssignment(id, teacher.getId());
    }

    // -------------------------------------------------------------------------
    // Student endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/student/assignments")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AssignmentResponse> getStudentAssignments(Principal principal) {
        var student = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.getStudentAssignments(student.getId());
    }

    @PostMapping("/api/student/assignments/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionResponse submitAssignment(
            @PathVariable Long id,
            @RequestBody SubmitRequest req,
            Principal principal) {
        var student = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        return assignmentService.submitAssignment(id, req, student.getId());
    }
}
