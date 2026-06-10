package com.uzairtuition.batch;

import com.uzairtuition.course.CourseRepository;
import com.uzairtuition.enrollment.EnrollmentRequestRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRequestRepository enrollmentRequestRepository;

    public List<BatchResponse> getUpcomingAndActiveBatches() {
        return batchRepository.findByStatusInOrderByStartDateDesc(List.of("UPCOMING", "ACTIVE")).stream()
                .map(b -> BatchResponse.from(b, batchStudentRepository.countByBatchId(b.getId())))
                .toList();
    }

    public List<BatchResponse> getAllBatches(String status) {
        List<Batch> batches = (status != null && !status.isBlank())
                ? batchRepository.findByStatusOrderByStartDateDesc(status.toUpperCase())
                : batchRepository.findAllByOrderByStartDateDesc();
        return batches.stream()
                .map(b -> BatchResponse.from(b, batchStudentRepository.countByBatchId(b.getId())))
                .toList();
    }

    public BatchResponse getBatch(Long id) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(id), "Batch");
        return BatchResponse.from(batch, batchStudentRepository.countByBatchId(id));
    }

    public List<BatchResponse> getTeacherBatches(Long teacherId) {
        return batchRepository.findByTeacherId(teacherId).stream()
                .map(b -> BatchResponse.from(b, batchStudentRepository.countByBatchId(b.getId())))
                .toList();
    }

    public List<BatchResponse> getStudentBatches(Long studentId) {
        return batchRepository.findByStudentId(studentId).stream()
                .map(b -> BatchResponse.from(b, batchStudentRepository.countByBatchId(b.getId())))
                .toList();
    }

    public List<BatchBrowseResponse> browseBatches(String studentEmail) {
        User student = EntityFinder.findOrThrow(userRepository.findByEmail(studentEmail), "User");
        return batchRepository.findByStatusInOrderByStartDateDesc(List.of("ACTIVE", "UPCOMING")).stream()
                .map(b -> {
                    long count = batchStudentRepository.countByBatchId(b.getId());
                    boolean enrolled = batchStudentRepository.existsByBatchIdAndStudentId(b.getId(), student.getId());
                    String requestStatus = enrollmentRequestRepository
                            .findByBatchIdAndStudentId(b.getId(), student.getId())
                            .map(r -> r.getStatus())
                            .orElse(null);
                    return BatchBrowseResponse.from(b, count, enrolled, requestStatus);
                })
                .toList();
    }

    @Transactional
    public BatchResponse createBatch(BatchRequest req) {
        var course = EntityFinder.findOrThrow(courseRepository.findById(req.courseId()), "Course");
        User teacher = resolveTeacher(req.teacherId());

        Batch batch = Batch.builder()
                .name(req.name().trim())
                .course(course)
                .teacher(teacher)
                .startDate(req.startDate())
                .endDate(req.endDate())
                .timings(req.timings())
                .maxStudents(req.maxStudents() != null ? req.maxStudents() : 30)
                .status(req.status() != null ? req.status() : "UPCOMING")
                .build();
        return BatchResponse.from(batchRepository.save(batch), 0);
    }

    @Transactional
    public BatchResponse updateBatch(Long id, BatchRequest req) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(id), "Batch");
        var course = EntityFinder.findOrThrow(courseRepository.findById(req.courseId()), "Course");

        batch.setName(req.name().trim());
        batch.setCourse(course);
        batch.setTeacher(resolveTeacher(req.teacherId()));
        batch.setStartDate(req.startDate());
        batch.setEndDate(req.endDate());
        batch.setTimings(req.timings());
        if (req.maxStudents() != null) batch.setMaxStudents(req.maxStudents());
        if (req.status() != null) batch.setStatus(req.status());

        long count = batchStudentRepository.countByBatchId(id);
        return BatchResponse.from(batchRepository.save(batch), count);
    }

    @Transactional
    public void deleteBatch(Long id) {
        EntityFinder.findOrThrow(batchRepository.findById(id), "Batch");
        batchRepository.deleteById(id);
    }

    public List<BatchStudentResponse> getStudents(Long batchId) {
        EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        return batchStudentRepository.findByBatchIdOrderByEnrolledAtDesc(batchId).stream()
                .map(BatchStudentResponse::from)
                .toList();
    }

    @Transactional
    public BatchStudentResponse enrollStudent(Long batchId, Long studentId) {
        Batch batch = EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        User student = EntityFinder.findOrThrow(userRepository.findById(studentId), "Student");

        boolean isStudent = student.getRoles().stream().anyMatch(r -> r.getName().equals("STUDENT"));
        if (!isStudent) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a student.");

        if (batchStudentRepository.existsByBatchIdAndStudentId(batchId, studentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student already enrolled in this batch.");
        }

        long current = batchStudentRepository.countByBatchId(batchId);
        if (current >= batch.getMaxStudents()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch is full.");
        }

        BatchStudent bs = BatchStudent.builder().batch(batch).student(student).build();
        return BatchStudentResponse.from(batchStudentRepository.save(bs));
    }

    @Transactional
    public void removeStudent(Long batchId, Long studentId) {
        EntityFinder.findOrThrow(batchRepository.findById(batchId), "Batch");
        BatchStudent bs = EntityFinder.findOrThrow(
                batchStudentRepository.findByBatchIdAndStudentId(batchId, studentId), "Enrollment");
        batchStudentRepository.delete(bs);
    }

    private User resolveTeacher(Long teacherId) {
        if (teacherId == null) return null;
        User teacher = EntityFinder.findOrThrow(userRepository.findById(teacherId), "Teacher");
        boolean isTeacher = teacher.getRoles().stream().anyMatch(r -> r.getName().equals("TEACHER"));
        if (!isTeacher) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a teacher.");
        return teacher;
    }
}
