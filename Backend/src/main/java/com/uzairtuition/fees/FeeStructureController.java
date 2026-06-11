package com.uzairtuition.fees;

import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudent;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.payment.Payment;
import com.uzairtuition.payment.PaymentRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class FeeStructureController {

    private final FeeStructureRepository feeStructureRepository;
    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final PaymentRepository paymentRepository;

    @GetMapping("/api/admin/batches/{batchId}/fee-structure")
    @PreAuthorize("hasRole('ADMIN')")
    public FeeStructure getFeeStructure(@PathVariable Long batchId) {
        EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        return feeStructureRepository.findByBatchId(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No fee structure found for this batch."));
    }

    @PutMapping("/api/admin/batches/{batchId}/fee-structure")
    @PreAuthorize("hasRole('ADMIN')")
    public FeeStructure upsertFeeStructure(@PathVariable Long batchId, @RequestBody FeeStructureRequest req) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");

        if (req.amount() == null || req.amount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive.");
        }

        String feeType = req.feeType() != null ? req.feeType().toUpperCase() : "MONTHLY";
        if (!feeType.equals("MONTHLY") && !feeType.equals("ONE_TIME")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fee type must be MONTHLY or ONE_TIME.");
        }

        FeeStructure fs = feeStructureRepository.findByBatchId(batchId)
                .orElse(FeeStructure.builder().batch(batch).build());

        fs.setFeeType(feeType);
        fs.setAmount(req.amount());
        fs.setDescription(req.description());
        fs.setDueDay(feeType.equals("MONTHLY") ? req.dueDay() : null);

        return feeStructureRepository.save(fs);
    }

    @PostMapping("/api/admin/batches/{batchId}/fee-structure/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> generatePayments(@PathVariable Long batchId) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");

        FeeStructure fs = feeStructureRepository.findByBatchId(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fee structure configured for this batch."));

        List<BatchStudent> enrollments = batchStudentRepository.findByBatchIdOrderByEnrolledAtDesc(batchId);
        if (enrollments.isEmpty()) {
            return Map.of("created", 0, "message", "No students enrolled in this batch.");
        }

        List<Payment> existingPayments = paymentRepository.findByBatchIdOrderByCreatedAtDesc(batchId);

        int created = 0;

        if ("MONTHLY".equals(fs.getFeeType())) {
            YearMonth currentMonth = YearMonth.now();
            LocalDateTime monthStart = currentMonth.atDay(1).atStartOfDay();
            LocalDateTime monthEnd = currentMonth.atEndOfMonth().atTime(23, 59, 59);

            for (BatchStudent bs : enrollments) {
                Long studentId = bs.getStudent().getId();
                boolean alreadyExists = existingPayments.stream().anyMatch(p ->
                        p.getStudent().getId().equals(studentId)
                                && p.getCreatedAt() != null
                                && !p.getCreatedAt().isBefore(monthStart)
                                && !p.getCreatedAt().isAfter(monthEnd));

                if (!alreadyExists) {
                    Payment payment = Payment.builder()
                            .student(bs.getStudent())
                            .batch(batch)
                            .amount(fs.getAmount())
                            .status("PENDING")
                            .notes("Auto-generated for " + currentMonth.getMonth().name() + " " + currentMonth.getYear())
                            .build();
                    paymentRepository.save(payment);
                    created++;
                }
            }
        } else {
            // ONE_TIME: create one payment per student if none exists for this batch
            for (BatchStudent bs : enrollments) {
                Long studentId = bs.getStudent().getId();
                boolean alreadyExists = existingPayments.stream()
                        .anyMatch(p -> p.getStudent().getId().equals(studentId));

                if (!alreadyExists) {
                    Payment payment = Payment.builder()
                            .student(bs.getStudent())
                            .batch(batch)
                            .amount(fs.getAmount())
                            .status("PENDING")
                            .notes(fs.getDescription() != null ? fs.getDescription() : "One-time fee")
                            .build();
                    paymentRepository.save(payment);
                    created++;
                }
            }
        }

        return Map.of("created", created, "message", created + " payment record(s) generated.");
    }
}
