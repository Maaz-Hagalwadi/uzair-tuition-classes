package com.uzairtuition.course;

import com.uzairtuition.batch.BatchStudentRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final BatchStudentRepository batchStudentRepository;

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(c -> CourseResponse.from(c, materialRepository.countByCourseId(c.getId())))
                .toList();
    }

    public List<CourseResponse> getActiveCourses() {
        return courseRepository.findByStatusOrderByCreatedAtDesc("ACTIVE").stream()
                .map(c -> CourseResponse.from(c, materialRepository.countByCourseId(c.getId())))
                .toList();
    }

    public CourseResponse getCourse(Long id) {
        Course course = findOrThrow(id);
        return CourseResponse.from(course, materialRepository.countByCourseId(id));
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest req, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        Course course = Course.builder()
                .title(req.title().trim())
                .description(req.description())
                .duration(req.duration())
                .thumbnailUrl(req.thumbnailUrl())
                .status(req.status() != null ? req.status() : "ACTIVE")
                .createdBy(creator)
                .build();
        return CourseResponse.from(courseRepository.save(course), 0);
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest req) {
        Course course = findOrThrow(id);
        course.setTitle(req.title().trim());
        course.setDescription(req.description());
        course.setDuration(req.duration());
        course.setThumbnailUrl(req.thumbnailUrl());
        if (req.status() != null) course.setStatus(req.status());
        long count = materialRepository.countByCourseId(id);
        return CourseResponse.from(courseRepository.save(course), count);
    }

    @Transactional
    public void deleteCourse(Long id) {
        findOrThrow(id);
        courseRepository.deleteById(id);
    }

    // Materials

    public List<CourseMaterialResponse> getStudentMaterials(Long courseId, String studentEmail) {
        findOrThrow(courseId);
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        boolean enrolled = batchStudentRepository.existsByBatch_CourseIdAndStudentId(courseId, student.getId());
        if (!enrolled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not enrolled in this course.");
        }
        return materialRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .map(CourseMaterialResponse::from)
                .toList();
    }

    public List<CourseMaterialResponse> getMaterials(Long courseId) {
        findOrThrow(courseId);
        return materialRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .map(CourseMaterialResponse::from)
                .toList();
    }

    @Transactional
    public CourseMaterialResponse addMaterial(Long courseId, CourseMaterialRequest req, String uploaderEmail) {
        Course course = findOrThrow(courseId);
        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        CourseMaterial material = CourseMaterial.builder()
                .course(course)
                .title(req.title().trim())
                .fileUrl(req.fileUrl().trim())
                .fileType(req.fileType())
                .uploadedBy(uploader)
                .build();
        return CourseMaterialResponse.from(materialRepository.save(material));
    }

    @Transactional
    public void deleteMaterial(Long courseId, Long materialId) {
        findOrThrow(courseId);
        CourseMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found."));
        if (!material.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Material does not belong to this course.");
        }
        materialRepository.deleteById(materialId);
    }

    private Course findOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found."));
    }
}
