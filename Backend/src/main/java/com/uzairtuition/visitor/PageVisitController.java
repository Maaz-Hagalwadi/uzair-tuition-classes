package com.uzairtuition.visitor;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PageVisitController {

    private final PageVisitRepository visitRepository;

    @PostMapping("/api/public/track")
    public ResponseEntity<Void> track(HttpServletRequest request,
                                      @RequestBody(required = false) Map<String, String> body) {
        String ua       = request.getHeader("User-Agent");
        String ip       = resolveIp(request);
        String page     = body != null ? body.getOrDefault("page", "/") : "/";
        String referrer = body != null ? body.get("referrer") : null;

        String browser = parseBrowser(ua);
        String os      = parseOs(ua);
        String device  = parseDevice(ua);

        visitRepository.save(PageVisit.builder()
                .ipAddress(ip)
                .userAgent(ua)
                .browser(browser)
                .os(os)
                .device(device)
                .page(page)
                .referrer(referrer)
                .build());

        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/admin/visitors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PageVisit> getVisitors() {
        return visitRepository.findTop50ByOrderByVisitedAtDesc();
    }

    @GetMapping("/api/admin/visitors/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> getStats() {
        LocalDateTime today    = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime thisWeek = today.minusDays(6);
        return Map.of(
                "totalVisits",        visitRepository.count(),
                "uniqueVisitors",     visitRepository.countDistinctIpAll(),
                "visitsToday",        visitRepository.countByVisitedAtAfter(today),
                "uniqueThisWeek",     visitRepository.countDistinctIpAfter(thisWeek)
        );
    }

    private String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xri = req.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri.trim();
        return req.getRemoteAddr();
    }

    private String parseBrowser(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Edg/"))     return "Edge";
        if (ua.contains("OPR/") || ua.contains("Opera")) return "Opera";
        if (ua.contains("Chrome/"))  return "Chrome";
        if (ua.contains("Firefox/")) return "Firefox";
        if (ua.contains("Safari/") && !ua.contains("Chrome")) return "Safari";
        return "Other";
    }

    private String parseOs(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Windows NT")) return "Windows";
        if (ua.contains("Mac OS X"))   return "macOS";
        if (ua.contains("Android"))    return "Android";
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Linux"))      return "Linux";
        return "Other";
    }

    private String parseDevice(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Mobile") || ua.contains("Android") || ua.contains("iPhone")) return "Mobile";
        if (ua.contains("iPad") || ua.contains("Tablet")) return "Tablet";
        return "Desktop";
    }
}
