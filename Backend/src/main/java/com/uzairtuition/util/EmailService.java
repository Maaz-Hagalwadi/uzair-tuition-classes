package com.uzairtuition.util;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    private final Resend resend;
    private final String from;
    private final String frontendUrl;

    public EmailService(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.resend.from}") String from,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.resend = new Resend(apiKey);
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    // ── Auth ─────────────────────────────────────────────────────────────────

    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        send(toEmail, "Verify your email — Uzair Tuition Classes", html(
                "Verify Your Email",
                "Thanks for signing up! Please confirm your email address to activate your account.",
                "Verify Email", link,
                "This link expires in 24 hours. If you didn't create an account, you can ignore this email."
        ));
    }

    public void sendOtpEmail(String toEmail, String otp, String firstName) {
        String formatted = otp.substring(0, 3) + " " + otp.substring(3);
        send(toEmail, "Your login code — Uzair Tuition Classes",
                "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif'>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='padding:40px 0'><tr><td align='center'>"
                + "<table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)'>"
                + "<tr><td style='background:#070235;padding:28px 40px;text-align:center'>"
                + "<span style='color:#fff;font-size:20px;font-weight:bold;letter-spacing:-0.5px'>Uzair Tuition Classes</span></td></tr>"
                + "<tr><td style='padding:36px 40px'>"
                + "<h2 style='margin:0 0 16px;font-size:22px;color:#070235'>Your Login Code</h2>"
                + "<p style='margin:0 0 28px;font-size:15px;color:#3c3c4e;line-height:1.6'>Hi " + firstName + ", use the code below to sign in. It expires in <strong>10 minutes</strong>.</p>"
                + "<div style='background:#f4f4f8;border-radius:12px;padding:20px 40px;text-align:center;margin:0 0 24px'>"
                + "<span style='font-size:44px;font-weight:bold;letter-spacing:10px;color:#070235;font-family:monospace'>" + formatted + "</span>"
                + "</div>"
                + "<p style='font-size:12px;color:#787680;margin:0'>If you didn't request this code, you can safely ignore this email.</p>"
                + "</td></tr>"
                + "<tr><td style='padding:20px 40px;border-top:1px solid #e4e2e6;text-align:center'>"
                + "<p style='margin:0;font-size:12px;color:#787680'>© 2026 Uzair Tuition Classes. All rights reserved.</p>"
                + "</td></tr></table></td></tr></table></body></html>"
        );
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        send(toEmail, "Reset your password — Uzair Tuition Classes", html(
                "Reset Your Password",
                "We received a request to reset your password. Click the button below to choose a new one.",
                "Reset Password", link,
                "This link expires in 15 minutes. If you didn't request a password reset, ignore this email."
        ));
    }

    public void sendTeacherApprovalEmail(String toEmail, String firstName) {
        send(toEmail, "Your teacher account has been approved — Uzair Tuition Classes", html(
                "Account Approved, " + firstName + "!",
                "Great news! Your teacher account at Uzair Tuition Classes has been reviewed and approved. You can now log in and start managing your batches.",
                "Go to Login", frontendUrl + "/login",
                null
        ));
    }

    // ── Enrollment ───────────────────────────────────────────────────────────

    public void sendEnrollmentRequestToAdmin(String toEmail, String studentName, String batchName) {
        send(toEmail, "New enrollment request — " + batchName, html(
                "New Enrollment Request",
                "<strong>" + studentName + "</strong> has submitted an enrollment request for <strong>"
                        + batchName + "</strong>. Log in to review and approve.",
                "Review Request", frontendUrl + "/admin/enrollment",
                null
        ));
    }

    public void sendEnrollmentApprovedEmail(String toEmail, String firstName, String batchName) {
        send(toEmail, "You're enrolled in " + batchName + "!", html(
                "Enrollment Approved!",
                "Hi " + firstName + ", your enrollment request for <strong>" + batchName
                        + "</strong> has been approved. Welcome to the batch!",
                "Go to My Courses", frontendUrl + "/student/courses",
                null
        ));
    }

    public void sendEnrollmentRejectedEmail(String toEmail, String firstName, String batchName, String note) {
        String reason = (note != null && !note.isBlank())
                ? "Reason: " + note
                : "Please contact us if you have questions.";
        send(toEmail, "Enrollment update for " + batchName, html(
                "Enrollment Not Approved",
                "Hi " + firstName + ", unfortunately your enrollment request for <strong>" + batchName
                        + "</strong> was not approved. " + reason,
                "View Courses", frontendUrl + "/student/courses",
                null
        ));
    }

    // ── Sessions ─────────────────────────────────────────────────────────────

    public void sendNewSessionEmail(String toEmail, String firstName, String title,
                                    LocalDate date, String startTime, String endTime,
                                    String meetingUrl, String platform) {
        String meetingInfo = (meetingUrl != null && !meetingUrl.isBlank())
                ? "Meeting link: <a href='" + meetingUrl + "' style='color:#070235'>" + meetingUrl + "</a>"
                : "Meeting details will be shared soon.";
        String platformLabel = (platform != null && !platform.isBlank()) ? " (" + platform + ")" : "";
        send(toEmail, "New session scheduled: " + title, html(
                "New Session Scheduled",
                "Hi " + firstName + ", a new session has been scheduled for your batch."
                        + "<br><br><strong>Session:</strong> " + title
                        + "<br><strong>Date:</strong> " + date
                        + "<br><strong>Time:</strong> " + startTime + " – " + endTime + platformLabel
                        + "<br><br>" + meetingInfo,
                "View Sessions", frontendUrl + "/student/sessions",
                null
        ));
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    public void sendAnnouncementEmail(String toEmail, String firstName, String title,
                                      String content, String batchName) {
        String scope = batchName != null ? "for <strong>" + batchName + "</strong>" : "for all students";
        send(toEmail, "New announcement: " + title, html(
                title,
                "Hi " + firstName + ", there's a new announcement " + scope + "."
                        + "<br><br>" + content,
                "View Announcements", frontendUrl + "/student/announcements",
                null
        ));
    }

    // ── Payments ─────────────────────────────────────────────────────────────

    public void sendPaymentUpdateEmail(String toEmail, String firstName, String batchName, String status) {
        String statusMsg = switch (status.toUpperCase()) {
            case "PAID"    -> "Your payment for <strong>" + batchName + "</strong> has been marked as <strong>Paid</strong>. Thank you!";
            case "OVERDUE" -> "Your payment for <strong>" + batchName + "</strong> is now <strong>Overdue</strong>. Please settle it as soon as possible.";
            case "WAIVED"  -> "Your payment for <strong>" + batchName + "</strong> has been <strong>Waived</strong>.";
            default        -> "Your payment status for <strong>" + batchName + "</strong> has been updated to <strong>" + status + "</strong>.";
        };
        send(toEmail, "Payment update — " + batchName, html(
                "Payment Update",
                "Hi " + firstName + ", " + statusMsg,
                "View Payments", frontendUrl + "/student/payments",
                null
        ));
    }

    // ── Leads ─────────────────────────────────────────────────────────────────

    public void sendNewLeadEmail(String toEmail, String leadName, String leadEmail,
                                 String phone, String course) {
        String courseText = course != null ? course : "a course";
        send(toEmail, "New enquiry from " + leadName, html(
                "New Enquiry Received",
                "A new enquiry has been submitted."
                        + "<br><br><strong>Name:</strong> " + leadName
                        + "<br><strong>Email:</strong> " + leadEmail
                        + "<br><strong>Phone:</strong> " + phone
                        + "<br><strong>Interested in:</strong> " + courseText,
                "View Leads", frontendUrl + "/admin/leads",
                null
        ));
    }

    // ── Core ─────────────────────────────────────────────────────────────────

    private void send(String to, String subject, String htmlBody) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(from)
                    .to(List.of(to))
                    .subject(subject)
                    .html(htmlBody)
                    .build();
            resend.emails().send(params);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String html(String heading, String body, String btnText, String btnUrl, String footer) {
        String footerHtml = footer != null
                ? "<p style='font-size:12px;color:#787680;margin-top:24px'>" + footer + "</p>"
                : "";
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif'>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='padding:40px 0'><tr><td align='center'>"
                + "<table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)'>"
                + "<tr><td style='background:#070235;padding:28px 40px;text-align:center'>"
                + "<span style='color:#fff;font-size:20px;font-weight:bold;letter-spacing:-0.5px'>Uzair Tuition Classes</span></td></tr>"
                + "<tr><td style='padding:36px 40px'>"
                + "<h2 style='margin:0 0 16px;font-size:22px;color:#070235'>" + heading + "</h2>"
                + "<p style='margin:0 0 28px;font-size:15px;color:#3c3c4e;line-height:1.6'>" + body + "</p>"
                + "<a href='" + btnUrl + "' style='display:inline-block;background:#070235;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold'>" + btnText + "</a>"
                + footerHtml
                + "</td></tr>"
                + "<tr><td style='padding:20px 40px;border-top:1px solid #e4e2e6;text-align:center'>"
                + "<p style='margin:0;font-size:12px;color:#787680'>© 2026 Uzair Tuition Classes. All rights reserved.</p>"
                + "</td></tr></table></td></tr></table></body></html>";
    }
}
