package com.uzairtuition.course;

import com.uzairtuition.batch.BatchStudentRepository;
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
        Course course = EntityFinder.findOrThrow(courseRepository.findById(id), "Course");
        return CourseResponse.from(course, materialRepository.countByCourseId(id));
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest req, String creatorEmail) {
        User creator = EntityFinder.findOrThrow(userRepository.findByEmail(creatorEmail), "User");
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
        Course course = EntityFinder.findOrThrow(courseRepository.findById(id), "Course");
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
        EntityFinder.findOrThrow(courseRepository.findById(id), "Course");
        courseRepository.deleteById(id);
    }

    public List<CourseMaterialResponse> getStudentMaterials(Long courseId, String studentEmail) {
        EntityFinder.findOrThrow(courseRepository.findById(courseId), "Course");
        User student = EntityFinder.findOrThrow(userRepository.findByEmail(studentEmail), "User");
        boolean enrolled = batchStudentRepository.existsByBatch_CourseIdAndStudentId(courseId, student.getId());
        if (!enrolled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not enrolled in this course.");
        }
        return materialRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .map(CourseMaterialResponse::from)
                .toList();
    }

    public List<CourseMaterialResponse> getMaterials(Long courseId) {
        EntityFinder.findOrThrow(courseRepository.findById(courseId), "Course");
        return materialRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .map(CourseMaterialResponse::from)
                .toList();
    }

    @Transactional
    public CourseMaterialResponse addMaterial(Long courseId, CourseMaterialRequest req, String uploaderEmail) {
        Course course = EntityFinder.findOrThrow(courseRepository.findById(courseId), "Course");
        User uploader = EntityFinder.findOrThrow(userRepository.findByEmail(uploaderEmail), "User");
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
        EntityFinder.findOrThrow(courseRepository.findById(courseId), "Course");
        CourseMaterial material = EntityFinder.findOrThrow(materialRepository.findById(materialId), "Material");
        if (!material.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Material does not belong to this course.");
        }
        materialRepository.deleteById(materialId);
    }
}
