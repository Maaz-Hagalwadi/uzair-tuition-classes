package com.uzairtuition.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT   = 10;   // requests per minute for /api/auth/**
    private static final int GLOBAL_LIMIT = 60;   // requests per minute for everything else

    private final StringRedisTemplate redis;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String ip  = resolveIp(request);
        String uri = request.getRequestURI();

        // Skip rate limiting for static assets and ping
        if (uri.startsWith("/actuator") || uri.equals("/api/ping")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isAuth = uri.startsWith("/api/auth/");
        int limit      = isAuth ? AUTH_LIMIT : GLOBAL_LIMIT;
        String bucket  = isAuth ? "auth" : "api";
        long window    = Instant.now().getEpochSecond() / 60; // current minute window

        String key   = "rl:" + ip + ":" + bucket + ":" + window;
        Long count   = redis.opsForValue().increment(key);

        if (count != null && count == 1) {
            redis.expire(key, 70, TimeUnit.SECONDS); // 70s to cover window boundary
        }

        if (count != null && count > limit) {
            int retryAfter = 60 - (int)(Instant.now().getEpochSecond() % 60);
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.getWriter().write(
                    "{\"error\":\"Too many requests\",\"message\":\"Slow down — try again in "
                    + retryAfter + " second(s).\"}"
            );
            return;
        }

        if (count != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));
        }

        filterChain.doFilter(request, response);
    }

    private String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xri = req.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri.trim();
        return req.getRemoteAddr();
    }
}
