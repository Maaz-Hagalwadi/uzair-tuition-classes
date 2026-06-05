package com.uzairtuition.payment;

import com.uzairtuition.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @PostMapping("/api/admin/payments")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@Valid @RequestBody PaymentRequest req) {
        return paymentService.create(req);
    }

    @GetMapping("/api/admin/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentResponse> getAll(@RequestParam(required = false) String status) {
        return paymentService.getAll(status);
    }

    @PutMapping("/api/admin/payments/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return paymentService.updateStatus(id, body.get("status"));
    }

    @DeleteMapping("/api/admin/payments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        paymentService.delete(id);
    }

    @GetMapping("/api/student/payments")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PaymentResponse> getStudentPayments(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return paymentService.getStudentPayments(user.getId());
    }
}
