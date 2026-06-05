package com.uzairtuition.course;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // Public — for landing page
    @GetMapping("/api/public/courses")
    public List<CourseResponse> publicList() {
        return courseService.getActiveCourses();
    }

    // Admin — full list
    @GetMapping("/api/admin/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CourseResponse> list() {
        return courseService.getAllCourses();
    }

    @GetMapping("/api/admin/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse get(@PathVariable Long id) {
        return courseService.getCourse(id);
    }

    @PostMapping("/api/admin/courses")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(Principal principal, @Valid @RequestBody CourseRequest req) {
        return courseService.createCourse(req, principal.getName());
    }

    @PutMapping("/api/admin/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest req) {
        return courseService.updateCourse(id, req);
    }

    @DeleteMapping("/api/admin/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        courseService.deleteCourse(id);
    }

    // Materials
    @GetMapping("/api/admin/courses/{id}/materials")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public List<CourseMaterialResponse> getMaterials(@PathVariable Long id) {
        return courseService.getMaterials(id);
    }

    @PostMapping("/api/admin/courses/{id}/materials")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseMaterialResponse addMaterial(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody CourseMaterialRequest req) {
        return courseService.addMaterial(id, req, principal.getName());
    }

    @DeleteMapping("/api/admin/courses/{id}/materials/{materialId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMaterial(@PathVariable Long id, @PathVariable Long materialId) {
        courseService.deleteMaterial(id, materialId);
    }

    // Student
    @GetMapping("/api/student/courses/{id}/materials")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CourseMaterialResponse> getStudentMaterials(@PathVariable Long id, Principal principal) {
        return courseService.getStudentMaterials(id, principal.getName());
    }
}
