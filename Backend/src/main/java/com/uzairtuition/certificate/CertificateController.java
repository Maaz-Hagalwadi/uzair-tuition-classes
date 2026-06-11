package com.uzairtuition.certificate;

import com.uzairtuition.assignment.Assignment;
import com.uzairtuition.assignment.AssignmentRepository;
import com.uzairtuition.assignment.AssignmentSubmission;
import com.uzairtuition.assignment.AssignmentSubmissionRepository;
import com.uzairtuition.attendance.Attendance;
import com.uzairtuition.attendance.AttendanceRepository;
import com.uzairtuition.batch.Batch;
import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.classsession.ClassSessionRepository;
import com.uzairtuition.quiz.QuizAttempt;
import com.uzairtuition.quiz.QuizAttemptRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class CertificateController {

    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @GetMapping("/api/admin/batches/{batchId}/students/{studentId}/certificate")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<String> generateCertificate(
            @PathVariable Long batchId,
            @PathVariable Long studentId) {

        Batch batch   = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        User  student = EntityFinder.findOrThrow(userRepository.findById(studentId), "Student");

        if (!batchStudentRepository.existsByBatchIdAndStudentId(batchId, studentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Student is not enrolled in this batch");
        }

        String courseName   = batch.getCourse().getTitle();
        String studentName  = student.getFirstName() + " " + student.getLastName();
        String batchName    = batch.getName();
        String completionDate = (batch.getEndDate() != null ? batch.getEndDate() : LocalDate.now())
                .format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        String html = buildHtml(studentName, courseName, batchName, completionDate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
                .body(html);
    }

    @GetMapping("/api/student/batches/{batchId}/certificate")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<String> getOwnCertificate(
            @PathVariable Long batchId,
            Principal principal) {

        User student = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "Student");
        Long studentId = student.getId();

        if (!batchStudentRepository.existsByBatchIdAndStudentId(batchId, studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this batch.");
        }

        int completionPct = computeBatchCompletionPct(studentId, batchId);
        if (completionPct < 95) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Certificate requires 95% course completion. Your current progress: " + completionPct + "%");
        }

        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        String courseName   = batch.getCourse().getTitle();
        String studentName  = student.getFirstName() + " " + student.getLastName();
        String batchName    = batch.getName();
        String completionDate = (batch.getEndDate() != null ? batch.getEndDate() : LocalDate.now())
                .format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
                .body(buildHtml(studentName, courseName, batchName, completionDate));
    }

    private int computeBatchCompletionPct(Long studentId, Long batchId) {
        // Attendance component
        List<Attendance> attendance = attendanceRepository.findByStudentIdAndBatchId(studentId, batchId);
        int totalSessions = classSessionRepository.findByBatchIdOrderBySessionDateDesc(batchId).size();
        long attended = attendance.stream()
                .filter(a -> "PRESENT".equals(a.getStatus()) || "LATE".equals(a.getStatus()))
                .count();
        int attPct = totalSessions > 0 ? (int) Math.round(attended * 100.0 / totalSessions) : 0;

        // Assignment submission component
        List<Assignment> assignments = assignmentRepository.findByBatchIdOrderByCreatedAtDesc(batchId);
        int totalAssignments = assignments.size();
        List<Long> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        long submitted = assignmentSubmissionRepository
                .findByStudentIdAndAssignment_BatchIdIn(studentId, List.of(batchId)).stream()
                .filter(s -> assignmentIds.contains(s.getAssignment().getId()))
                .count();
        int assignPct = totalAssignments > 0 ? (int) Math.round(submitted * 100.0 / totalAssignments) : 0;

        // Quiz average component
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .filter(a -> ("SUBMITTED".equals(a.getStatus()) || "COMPLETED".equals(a.getStatus()))
                        && a.getQuiz().getBatch().getId().equals(batchId))
                .toList();
        int quizPct = 0;
        if (!attempts.isEmpty()) {
            List<QuizAttempt> scored = attempts.stream()
                    .filter(a -> a.getScore() != null && a.getTotalMarks() != null && a.getTotalMarks() > 0)
                    .toList();
            if (!scored.isEmpty()) {
                double avg = scored.stream()
                        .mapToDouble(a -> a.getScore() * 100.0 / a.getTotalMarks())
                        .average().orElse(0);
                quizPct = (int) Math.round(avg);
            }
        }

        return (int) Math.round(attPct * 0.4 + assignPct * 0.4 + quizPct * 0.2);
    }

    private String buildHtml(String studentName, String courseName,
                              String batchName, String completionDate) {
        String styles =
            "* { margin:0; padding:0; box-sizing:border-box; }" +
            "html,body { width:100%; height:100%; background:#f5f0e8; }" +
            "body { display:flex; align-items:center; justify-content:center; min-height:100vh;" +
            "  font-family:Georgia,serif; }" +
            ".cert { width:900px; max-width:95vw; background:#fff; border:2px solid #c9a84c;" +
            "  outline:8px solid #f5f0e8; outline-offset:-18px; padding:60px 80px;" +
            "  text-align:center; position:relative; box-shadow:0 4px 40px rgba(0,0,0,.12); }" +
            ".corner { position:absolute; width:60px; height:60px; border-color:#c9a84c; border-style:solid; }" +
            ".tl{top:14px;left:14px;border-width:3px 0 0 3px}" +
            ".tr{top:14px;right:14px;border-width:3px 3px 0 0}" +
            ".bl{bottom:14px;left:14px;border-width:0 0 3px 3px}" +
            ".br{bottom:14px;right:14px;border-width:0 3px 3px 0}" +
            ".org { font-size:13px; font-weight:bold; letter-spacing:4px; text-transform:uppercase;" +
            "  color:#070235; margin-bottom:4px; }" +
            ".tagline { font-size:11px; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:28px; }" +
            ".divider { width:80px; height:2px; background:#c9a84c; margin:0 auto 28px; }" +
            ".cert-label { font-style:italic; font-size:15px; color:#888; margin-bottom:6px; }" +
            ".cert-title { font-size:38px; color:#070235; font-weight:bold; margin-bottom:24px; }" +
            ".presented { font-size:12px; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }" +
            ".name { font-style:italic; font-size:44px; color:#c9a84c; margin-bottom:24px;" +
            "  border-bottom:1px solid #e8e0d0; padding-bottom:18px; }" +
            ".body-txt { font-size:15px; color:#555; line-height:1.8; max-width:560px; margin:0 auto 28px; }" +
            ".course { font-weight:bold; color:#070235; }" +
            ".batch { color:#666; font-size:13px; }" +
            ".meta { display:flex; justify-content:space-between; align-items:flex-end;" +
            "  margin-top:44px; padding-top:20px; border-top:1px solid #e8e0d0; }" +
            ".meta-item { text-align:center; }" +
            ".meta-val { font-size:13px; font-weight:bold; color:#070235; border-bottom:1px solid #c9a84c;" +
            "  padding-bottom:4px; margin-bottom:4px; min-width:140px; }" +
            ".meta-lbl { font-size:10px; color:#999; letter-spacing:1.5px; text-transform:uppercase; }" +
            ".seal { width:72px; height:72px; border-radius:50%; background:#070235;" +
            "  display:flex; align-items:center; justify-content:center; margin:0 auto; }" +
            ".seal span { color:#c9a84c; font-size:11px; font-weight:bold; letter-spacing:1px;" +
            "  text-align:center; line-height:1.5; }" +
            ".print-btn { position:fixed; bottom:28px; right:28px; background:#070235; color:#fff;" +
            "  border:none; padding:12px 22px; border-radius:8px; font-size:14px; font-weight:600;" +
            "  cursor:pointer; box-shadow:0 4px 12px rgba(7,2,53,.3); }" +
            ".print-btn:hover { background:#1e1b4b; }" +
            "@media print { html,body{background:white} body{min-height:unset}" +
            "  .cert{box-shadow:none;outline:none;width:100%;max-width:100%;padding:40px 60px}" +
            "  @page{size:landscape;margin:10mm} .print-btn{display:none} }";

        return "<!DOCTYPE html><html lang=\"en\"><head>" +
               "<meta charset=\"UTF-8\"/>" +
               "<title>Certificate — " + studentName + "</title>" +
               "<style>" + styles + "</style></head><body>" +
               "<div class=\"cert\">" +
               "  <div class=\"corner tl\"></div><div class=\"corner tr\"></div>" +
               "  <div class=\"corner bl\"></div><div class=\"corner br\"></div>" +
               "  <div class=\"org\">Uzair Tuition Classes</div>" +
               "  <div class=\"tagline\">Excellence in Education</div>" +
               "  <div class=\"divider\"></div>" +
               "  <div class=\"cert-label\">This is to certify that</div>" +
               "  <div class=\"cert-title\">Certificate of Completion</div>" +
               "  <div class=\"presented\">Presented to</div>" +
               "  <div class=\"name\">" + studentName + "</div>" +
               "  <p class=\"body-txt\">has successfully completed the course" +
               "    <br/><span class=\"course\">" + courseName + "</span>" +
               "    <br/><span class=\"batch\">" + batchName + "</span></p>" +
               "  <div class=\"meta\">" +
               "    <div class=\"meta-item\">" +
               "      <div class=\"meta-val\">" + completionDate + "</div>" +
               "      <div class=\"meta-lbl\">Date of Completion</div>" +
               "    </div>" +
               "    <div class=\"meta-item\">" +
               "      <div class=\"seal\"><span>UTC<br/>CERT</span></div>" +
               "    </div>" +
               "    <div class=\"meta-item\">" +
               "      <div class=\"meta-val\">Uzair Davalji</div>" +
               "      <div class=\"meta-lbl\">Director, Uzair Tuition Classes</div>" +
               "    </div>" +
               "  </div>" +
               "</div>" +
               "<button class=\"print-btn\" onclick=\"window.print()\">&#128438; Print / Save PDF</button>" +
               "</body></html>";
    }
}
