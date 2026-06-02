package com.uzairtuition.config;

import com.uzairtuition.user.Role;
import com.uzairtuition.user.RoleRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createDefaultAdmin();
    }

    private void createDefaultAdmin() {
        if (userRepository.existsByEmail("admin@uzairtuition.com")) {
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found — check Flyway migration V2"));

        User admin = User.builder()
                .firstName("Admin")
                .lastName("UTC")
                .email("admin@uzairtuition.com")
                .password(passwordEncoder.encode("Admin@123"))
                .active(true)
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);
        log.info("Default admin created: admin@uzairtuition.com / Admin@123");
    }
}
