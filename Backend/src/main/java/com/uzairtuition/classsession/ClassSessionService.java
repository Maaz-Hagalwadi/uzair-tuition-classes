package com.uzairtuition.classsession;

import com.uzairtuition.batch.BatchRepository;
import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.notification.NotificationService;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassSessionService {

    private final ClassSessionRepository sessionRepository;
    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<ClassSessionResponse> getBatchSessions(Long batchId) {
        return sessionRepository.findByBatchIdOrderBySessionDateAscStartTimeAsc(batchId)
                .stream().map(ClassSessionResponse::from).toList();
    }

    public List<ClassSessionResponse> getUpcomingForStudent(Long studentId) {
        return sessionRepository.findUpcomingForStudent(studentId, LocalDate.now())
                .stream().map(ClassSessionResponse::from).toList();
    }

    public List<ClassSessionResponse> getUpcomingForTeacher(Long teacherId) {
        return sessionRepository.findUpcomingForTeacher(teacherId, LocalDate.now())
                .stream().map(ClassSessionResponse::from).toList();
    }

    @Transactional
    public ClassSessionResponse create(Long batchId, ClassSessionRequest req, String creatorEmail) {
        var batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found."));
        var creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        ClassSession session = ClassSession.builder()
                .batch(batch)
                .title(req.title().trim())
                .sessionDate(req.sessionDate())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .meetingUrl(req.meetingUrl())
                .meetingPlatform(req.meetingPlatform())
                .createdBy(creator)
                .build();
        ClassSessionResponse response = ClassSessionResponse.from(sessionRepository.save(session));

        batchStudentRepository.findByBatchIdOrderByEnrolledAtDesc(batchId)
                .forEach(bs -> notificationService.createForUser(
                        bs.getStudent(), "NEW_SESSION",
                        "New Session Scheduled",
                        req.title().trim() + " on " + req.sessionDate() + " at " + req.startTime(),
                        session.getId()
                ));

        return response;
    }

    @Transactional
    public ClassSessionResponse update(Long sessionId, ClassSessionRequest req) {
        ClassSession session = findOrThrow(sessionId);
        session.setTitle(req.title().trim());
        session.setSessionDate(req.sessionDate());
        session.setStartTime(req.startTime());
        session.setEndTime(req.endTime());
        session.setMeetingUrl(req.meetingUrl());
        session.setMeetingPlatform(req.meetingPlatform());
        return ClassSessionResponse.from(sessionRepository.save(session));
    }

    @Transactional
    public void delete(Long sessionId) {
        findOrThrow(sessionId);
        sessionRepository.deleteById(sessionId);
    }

    private ClassSession findOrThrow(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found."));
    }
}
