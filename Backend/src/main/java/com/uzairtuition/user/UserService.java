package com.uzairtuition.user;

import com.uzairtuition.util.EmailService;
import com.uzairtuition.util.EntityFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public List<UserResponse> getUsers(String role) {
        List<User> users = (role != null && !role.isBlank())
                ? userRepository.findByRoleName(role.toUpperCase())
                : userRepository.findAll();
        return users.stream().map(UserResponse::from).toList();
    }

    public List<UserResponse> getPendingTeachers() {
        return userRepository.findPendingTeachers().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse approveTeacher(Long userId) {
        User user = EntityFinder.findOrThrow(userRepository.findById(userId), "User");
        if (user.getRoles().stream().noneMatch(r -> r.getName().equals("TEACHER"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a teacher.");
        }
        user.setActive(true);
        user.setApprovalStatus("APPROVED");
        userRepository.save(user);
        emailService.sendTeacherApprovalEmail(user.getEmail(), user.getFirstName());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setActive(Long userId, boolean active) {
        User user = EntityFinder.findOrThrow(userRepository.findById(userId), "User");
        user.setActive(active);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest req, String roleName) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + roleName));
        User user = User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .phone(req.phone())
                .active(true)
                .emailVerified(true)
                .approvalStatus("TEACHER".equals(roleName) ? "APPROVED" : null)
                .roles(Set.of(role))
                .build();
        return UserResponse.from(userRepository.save(user));
    }
}
