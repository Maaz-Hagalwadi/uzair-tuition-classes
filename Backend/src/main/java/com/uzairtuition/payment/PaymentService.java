package com.uzairtuition.payment;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "PAID", "OVERDUE", "WAIVED");

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final NotificationService notificationService;

    public List<PaymentResponse> getAll(String status) {
        List<Payment> payments = (status != null && !status.isBlank())
                ? paymentRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : paymentRepository.findAllByOrderByCreatedAtDesc();
        return payments.stream()
                .map(PaymentResponse::from)
                .toList();
    }

    public List<PaymentResponse> getStudentPayments(Long studentId) {
        return paymentRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional
    public PaymentResponse create(PaymentRequest req) {
        User student = userRepository.findById(req.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found."));

        boolean isStudent = student.getRoles().stream().anyMatch(r -> r.getName().equals("STUDENT"));
        if (!isStudent) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a student.");
        }

        Batch batch = batchRepository.findById(req.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found."));

        Payment payment = Payment.builder()
                .student(student)
                .batch(batch)
                .amount(req.amount())
                .status(req.status() != null ? req.status() : "PENDING")
                .paymentDate(req.paymentDate())
                .notes(req.notes())
                .build();

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse updateStatus(Long id, String status) {
        if (status == null || !VALID_STATUSES.contains(status.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Must be one of: " + VALID_STATUSES);
        }

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found."));

        String newStatus = status.toUpperCase();
        payment.setStatus(newStatus);
        PaymentResponse response = PaymentResponse.from(paymentRepository.save(payment));

        String msg = switch (newStatus) {
            case "PAID"    -> "Your payment for " + payment.getBatch().getName() + " has been marked as Paid.";
            case "OVERDUE" -> "Your payment for " + payment.getBatch().getName() + " is now Overdue. Please settle it soon.";
            case "WAIVED"  -> "Your payment for " + payment.getBatch().getName() + " has been waived.";
            default        -> "Your payment status for " + payment.getBatch().getName() + " has been updated to " + newStatus + ".";
        };
        notificationService.createForUser(payment.getStudent(), "PAYMENT_UPDATED", "Payment Update", msg, payment.getId());

        return response;
    }

    @Transactional
    public void delete(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found.");
        }
        paymentRepository.deleteById(id);
    }
}
