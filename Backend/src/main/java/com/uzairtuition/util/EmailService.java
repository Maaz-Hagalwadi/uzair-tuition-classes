package com.uzairtuition.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        send(toEmail,
                "Verify your email — Uzair Tuition Classes",
                "Hello,\n\nPlease verify your email by clicking the link below:\n\n" + link
                        + "\n\nThis link expires in 24 hours.\n\nRegards,\nUzair Tuition Classes");
        log.info("Verification email sent to {} | token: {}", toEmail, token);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        send(toEmail,
                "Reset your password — Uzair Tuition Classes",
                "Hello,\n\nClick the link below to reset your password:\n\n" + link
                        + "\n\nThis link expires in 15 minutes.\n\nRegards,\nUzair Tuition Classes");
        log.info("Password reset email sent to {} | token: {}", toEmail, token);
    }

    public void sendTeacherApprovalEmail(String toEmail, String firstName) {
        send(toEmail,
                "Account Approved — Uzair Tuition Classes",
                "Hello " + firstName + ",\n\nYour teacher account has been approved. You can now login.\n\n"
                        + frontendUrl + "/login\n\nRegards,\nUzair Tuition Classes");
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@uzairtuition.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
