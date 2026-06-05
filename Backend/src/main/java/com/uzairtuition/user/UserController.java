package com.uzairtuition.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> listUsers(@RequestParam(required = false) String role) {
        return userService.getUsers(role);
    }

    @GetMapping("/pending")
    public List<UserResponse> pendingTeachers() {
        return userService.getPendingTeachers();
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<UserResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(userService.approveTeacher(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActive(id, false));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActive(id, true));
    }

    @PostMapping("/teachers")
    public ResponseEntity<UserResponse> createTeacher(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(req, "TEACHER"));
    }

    @PostMapping("/students")
    public ResponseEntity<UserResponse> createStudent(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(req, "STUDENT"));
    }
}
