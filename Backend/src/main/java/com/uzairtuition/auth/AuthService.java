package com.uzairtuition.auth;

import com.uzairtuition.auth.dto.*;
import com.uzairtuition.exception.BadRequestException;
import com.uzairtuition.exception.ResourceNotFoundException;
import com.uzairtuition.security.JwtService;
import com.uzairtuition.user.Role;
import com.uzairtuition.user.RoleRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String EMAIL_VERIFY_PREFIX  = "email_verify:";
    private static final String PWD_RESET_PREFIX     = "pwd_reset:";
    private static final String OTP_PREFIX           = "otp:";
    private static final String OTP_ATTEMPTS_PREFIX  = "otp_attempts:";
    private static final int    OTP_EXPIRY_SECONDS   = 600;  // 10 minutes
    private static final int    OTP_MAX_ATTEMPTS     = 5;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redis;
    private final EmailService emailService;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Value("${app.email-verify-expiry}")
    private long emailVerifyExpiry;

    @Value("${app.password-reset-expiry}")
    private long passwordResetExpiry;

    // ─── Login ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResult login(LoginRequest request, String ip, String userAgent) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email before logging in");
        }
        if (!user.isActive()) {
            throw new BadRequestException("Your account is pending admin approval");
        }

        loginHistoryRepository.save(LoginHistory.builder()
                .user(user)
                .ipAddress(ip)
                .userAgent(userAgent)
                .browser(parseBrowser(userAgent))
                .os(parseOs(userAgent))
                .device(parseDevice(userAgent))
                .build());

        String accessToken  = jwtService.generateAccessToken(toUserDetails(user));
        String refreshToken = createRefreshToken(user);
        return new AuthResult(buildResponse(accessToken, user), refreshToken);
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

    // ─── Register ────────────────────────────────────────────────────────────

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already in use");
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() -> new BadRequestException("Invalid role: " + request.role()));

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .active(false)
                .emailVerified(false)
                .approvalStatus("TEACHER".equals(request.role()) ? "PENDING" : null)
                .roles(Set.of(role))
                .build();

        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        redis.opsForValue().set(EMAIL_VERIFY_PREFIX + token,
                String.valueOf(user.getId()), emailVerifyExpiry, TimeUnit.SECONDS);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    // ─── Verify Email ────────────────────────────────────────────────────────

    @Transactional
    public void verifyEmail(String token) {
        String key    = EMAIL_VERIFY_PREFIX + token;
        String userId = redis.opsForValue().get(key);

        if (userId == null) {
            throw new BadRequestException("Verification link is invalid or has expired");
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User", Long.parseLong(userId)));

        user.setEmailVerified(true);

        // Students become active immediately; teachers wait for admin approval
        if (user.getApprovalStatus() == null) {
            user.setActive(true);
        }

        userRepository.save(user);
        redis.delete(key);

        if ("PENDING".equals(user.getApprovalStatus())) {
            String userName = user.getFirstName() + " " + user.getLastName();
            String role = user.getRoles().stream().map(Role::getName).findFirst().orElse("User");
            userRepository.findByRoleName("ADMIN").forEach(admin ->
                    emailService.sendNewUserPendingApprovalToAdmin(admin.getEmail(), userName, user.getEmail(), role));
        }
    }

    // ─── Refresh Token ───────────────────────────────────────────────────────

    @Transactional
    public AuthResult refresh(String tokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token expired, please login again");
        }

        User user        = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(toUserDetails(user));
        return new AuthResult(buildResponse(accessToken, user), tokenValue);
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }

    // ─── Forgot Password ─────────────────────────────────────────────────────

    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            redis.opsForValue().set(PWD_RESET_PREFIX + token,
                    email, passwordResetExpiry, TimeUnit.SECONDS);
            emailService.sendPasswordResetEmail(email, token);
        });
        // Always return success (don't reveal if email exists)
    }

    // ─── Reset Password ──────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String key   = PWD_RESET_PREFIX + request.token();
        String email = redis.opsForValue().get(key);

        if (email == null) {
            throw new BadRequestException("Reset link is invalid or has expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        redis.delete(key);
    }

    // ─── OTP Login ───────────────────────────────────────────────────────────

    public void sendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email before logging in");
        }
        if (!user.isActive()) {
            throw new BadRequestException("Your account is pending admin approval");
        }

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        redis.opsForValue().set(OTP_PREFIX + email, otp, OTP_EXPIRY_SECONDS, TimeUnit.SECONDS);
        redis.delete(OTP_ATTEMPTS_PREFIX + email);
        emailService.sendOtpEmail(email, otp, user.getFirstName());
    }

    @Transactional
    public AuthResult verifyOtp(OtpVerifyRequest request, String ip, String userAgent) {
        String key       = OTP_PREFIX + request.email();
        String storedOtp = redis.opsForValue().get(key);

        if (storedOtp == null) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        String attemptsKey = OTP_ATTEMPTS_PREFIX + request.email();
        int attempts = parseAttempts(redis.opsForValue().get(attemptsKey));

        if (attempts >= OTP_MAX_ATTEMPTS) {
            redis.delete(key);
            redis.delete(attemptsKey);
            throw new BadRequestException("Too many incorrect attempts. Please request a new OTP.");
        }

        if (!storedOtp.equals(request.otp())) {
            redis.opsForValue().set(attemptsKey, String.valueOf(attempts + 1),
                    OTP_EXPIRY_SECONDS, TimeUnit.SECONDS);
            throw new BadRequestException("Incorrect OTP. " + (OTP_MAX_ATTEMPTS - attempts - 1) + " attempts remaining.");
        }

        redis.delete(key);
        redis.delete(attemptsKey);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("User not found"));

        loginHistoryRepository.save(LoginHistory.builder()
                .user(user)
                .ipAddress(ip)
                .userAgent(userAgent)
                .browser(parseBrowser(userAgent))
                .os(parseOs(userAgent))
                .device(parseDevice(userAgent))
                .build());

        String accessToken  = jwtService.generateAccessToken(toUserDetails(user));
        String refreshToken = createRefreshToken(user);
        return new AuthResult(buildResponse(accessToken, user), refreshToken);
    }

    private int parseAttempts(String val) {
        try { return val != null ? Integer.parseInt(val) : 0; }
        catch (NumberFormatException e) { return 0; }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build();
        return refreshTokenRepository.save(token).getToken();
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRoles().stream()
                        .map(r -> "ROLE_" + r.getName())
                        .toArray(String[]::new))
                .build();
    }

    private AuthResponse buildResponse(String accessToken, User user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toSet());
        return new AuthResponse(accessToken,
                user.getFirstName(), user.getLastName(), user.getEmail(), roles);
    }
}
