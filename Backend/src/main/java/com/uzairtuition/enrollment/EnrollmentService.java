package com.uzairtuition.enrollment;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudent;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRequestRepository requestRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public EnrollmentRequestResponse requestEnrollment(Long batchId, String studentEmail) {
        User student = findStudentByEmail(studentEmail);
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found."));

        if (batchStudentRepository.existsByBatchIdAndStudentId(batchId, student.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled in this batch.");
        }
        if (requestRepository.existsByBatchIdAndStudentId(batchId, student.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Enrollment request already submitted.");
        }

        EnrollmentRequest req = EnrollmentRequest.builder()
                .student(student)
                .batch(batch)
                .status("PENDING")
                .build();
        EnrollmentRequestResponse response = EnrollmentRequestResponse.from(requestRepository.save(req));

        String notifTitle = "New Enrollment Request";
        String notifMsg   = student.getFirstName() + " " + student.getLastName()
                + " has requested to join " + batch.getName() + ".";

        if (batch.getTeacher() != null) {
            notificationService.createForUser(batch.getTeacher(), "ENROLLMENT_REQUEST", notifTitle, notifMsg, req.getId());
        }
        userRepository.findByRoleName("ADMIN")
                .forEach(admin -> notificationService.createForUser(admin, "ENROLLMENT_REQUEST", notifTitle, notifMsg, req.getId()));

        return response;
    }

    public List<EnrollmentRequestResponse> getStudentRequests(String studentEmail) {
        User student = findStudentByEmail(studentEmail);
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(EnrollmentRequestResponse::from)
                .toList();
    }

    public List<EnrollmentRequestResponse> getAllRequests(String status) {
        List<EnrollmentRequest> requests = (status != null && !status.isBlank())
                ? requestRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : requestRepository.findAllByOrderByCreatedAtDesc();
        return requests.stream().map(EnrollmentRequestResponse::from).toList();
    }

    public long countPending() {
        return requestRepository.countByStatus("PENDING");
    }

    @Transactional
    public EnrollmentRequestResponse approve(Long requestId) {
        EnrollmentRequest req = findOrThrow(requestId);
        if (!req.getStatus().equals("PENDING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not pending.");
        }

        long current = batchStudentRepository.countByBatchId(req.getBatch().getId());
        if (current >= req.getBatch().getMaxStudents()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch is full.");
        }

        batchStudentRepository.save(
                BatchStudent.builder().batch(req.getBatch()).student(req.getStudent()).build()
        );

        req.setStatus("APPROVED");
        EnrollmentRequestResponse result = EnrollmentRequestResponse.from(requestRepository.save(req));
        notificationService.createForUser(
                req.getStudent(), "ENROLLMENT_APPROVED",
                "Enrollment Approved",
                "Your enrollment in " + req.getBatch().getName() + " has been approved. Welcome!",
                req.getBatch().getId()
        );
        return result;
    }

    @Transactional
    public EnrollmentRequestResponse reject(Long requestId, String note) {
        EnrollmentRequest req = findOrThrow(requestId);
        if (!req.getStatus().equals("PENDING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not pending.");
        }
        req.setStatus("REJECTED");
        req.setNote(note);
        EnrollmentRequestResponse result = EnrollmentRequestResponse.from(requestRepository.save(req));
        notificationService.createForUser(
                req.getStudent(), "ENROLLMENT_REJECTED",
                "Enrollment Not Approved",
                "Your enrollment request for " + req.getBatch().getName() + " was not approved."
                        + (note != null && !note.isBlank() ? " Reason: " + note : ""),
                req.getBatch().getId()
        );
        return result;
    }

    private EnrollmentRequest findOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found."));
    }

    private User findStudentByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }
}
