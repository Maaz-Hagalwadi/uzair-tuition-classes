package com.uzairtuition.lead;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @PostMapping("/api/public/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public LeadResponse submit(@Valid @RequestBody LeadRequest req) {
        return leadService.submitLead(req);
    }

    @GetMapping("/api/admin/leads")
    @PreAuthorize("hasRole('ADMIN')")
    public List<LeadResponse> list(@RequestParam(required = false) String status) {
        return leadService.getLeads(status);
    }

    @GetMapping("/api/admin/leads/counts")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> counts() {
        return leadService.getCounts();
    }

    @PutMapping("/api/admin/leads/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public LeadResponse updateStatus(@PathVariable Long id, @RequestParam String value) {
        return leadService.updateStatus(id, value);
    }

    @DeleteMapping("/api/admin/leads/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        leadService.deleteLead(id);
    }
}
