package com.uzairtuition.assignment;

import com.uzairtuition.assignment.dto.*;
import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Teacher methods
    // -------------------------------------------------------------------------

    @Transactional
    public AssignmentResponse createAssignment(AssignmentRequest req, Long teacherId) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(req.batchId()), "Batch");
        if (batch.getTeacher() == null || !batch.getTeacher().getId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this batch.");
        }
        User teacher = EntityFinder.findOrThrow(userRepository.findById(teacherId), "Teacher");

        LocalDateTime dueDate = null;
        if (req.dueDate() != null && !req.dueDate().isBlank()) {
            dueDate = LocalDateTime.parse(req.dueDate(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }

        Assignment assignment = Assignment.builder()
                .batch(batch)
                .createdBy(teacher)
                .title(req.title().trim())
                .description(req.description())
                .dueDate(dueDate)
                .maxMarks(req.maxMarks() != null ? req.maxMarks() : 100)
                .attachmentUrl(req.attachmentUrl())
                .status("ACTIVE")
                .build();

        assignment = assignmentRepository.save(assignment);
        return AssignmentResponse.from(assignment, 0, null);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getTeacherAssignments(Long teacherId) {
        List<Batch> batches = batchRepository.findByTeacherId(teacherId);
        if (batches.isEmpty()) return List.of();

        List<Long> batchIds = batches.stream().map(Batch::getId).toList();

        return batches.stream()
                .flatMap(b -> assignmentRepository.findByBatchIdOrderByCreatedAtDesc(b.getId()).stream())
                .map(a -> {
                    long count = submissionRepository.countByAssignmentId(a.getId());
                    return AssignmentResponse.from(a, count, null);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getAssignmentSubmissions(Long assignmentId, Long teacherId) {
        Assignment assignment = EntityFinder.findOrThrow(assignmentRepository.findById(assignmentId), "Assignment");
        verifyTeacherOwnsBatch(assignment.getBatch().getId(), teacherId);
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(SubmissionResponse::from)
                .toList();
    }

    @Transactional
    public SubmissionResponse gradeSubmission(Long submissionId, GradeRequest req, Long teacherId) {
        AssignmentSubmission submission = EntityFinder.findOrThrow(
                submissionRepository.findById(submissionId), "Submission");
        verifyTeacherOwnsBatch(submission.getAssignment().getBatch().getId(), teacherId);

        User teacher = EntityFinder.findOrThrow(userRepository.findById(teacherId), "Teacher");
        submission.setMarksObtained(req.marksObtained());
        submission.setFeedback(req.feedback());
        submission.setGradedAt(LocalDateTime.now());
        submission.setGradedBy(teacher);
        return SubmissionResponse.from(submissionRepository.save(submission));
    }

    @Transactional
    public void deleteAssignment(Long id, Long teacherId) {
        Assignment assignment = EntityFinder.findOrThrow(assignmentRepository.findById(id), "Assignment");
        verifyTeacherOwnsBatch(assignment.getBatch().getId(), teacherId);
        assignmentRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // Student methods
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getStudentAssignments(Long studentId) {
        List<Batch> batches = batchRepository.findByStudentId(studentId);
        if (batches.isEmpty()) return List.of();

        List<Long> batchIds = batches.stream().map(Batch::getId).toList();
        List<Assignment> assignments = assignmentRepository.findByBatchIdInOrderByDueDateAsc(batchIds);

        // Fetch all submissions for this student in one query
        List<AssignmentSubmission> mySubmissions =
                submissionRepository.findByStudentIdAndAssignment_BatchIdIn(studentId, batchIds);
        Map<Long, AssignmentSubmission> submissionByAssignmentId = mySubmissions.stream()
                .collect(Collectors.toMap(s -> s.getAssignment().getId(), s -> s));

        return assignments.stream()
                .map(a -> {
                    long count = submissionRepository.countByAssignmentId(a.getId());
                    AssignmentSubmission mySub = submissionByAssignmentId.get(a.getId());
                    SubmissionResponse mySubResponse = mySub != null ? SubmissionResponse.from(mySub) : null;
                    return AssignmentResponse.from(a, count, mySubResponse);
                })
                .toList();
    }

    @Transactional
    public SubmissionResponse submitAssignment(Long assignmentId, SubmitRequest req, Long studentId) {
        Assignment assignment = EntityFinder.findOrThrow(assignmentRepository.findById(assignmentId), "Assignment");

        // Check not already submitted
        Optional<AssignmentSubmission> existing =
                submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already submitted this assignment.");
        }

        // Check due date
        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The due date for this assignment has passed.");
        }

        User student = EntityFinder.findOrThrow(userRepository.findById(studentId), "Student");

        AssignmentSubmission submission = AssignmentSubmission.builder()
                .assignment(assignment)
                .student(student)
                .textAnswer(req.textAnswer())
                .fileUrl(req.fileUrl())
                .build();

        return SubmissionResponse.from(submissionRepository.save(submission));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void verifyTeacherOwnsBatch(Long batchId, Long teacherId) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        if (batch.getTeacher() == null || !batch.getTeacher().getId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this batch.");
        }
    }
}
