package com.uzairtuition.security;

import com.uzairtuition.user.Role;
import com.uzairtuition.user.RoleRepository;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email      = oAuth2User.getAttribute("email");
        String firstName  = oAuth2User.getAttribute("given_name");
        String lastName   = oAuth2User.getAttribute("family_name");
        if (firstName == null) firstName = "User";
        if (lastName  == null) lastName  = "";

        final String fn = firstName;
        final String ln = lastName;

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Role studentRole = roleRepository.findByName("STUDENT")
                    .orElseThrow(() -> new RuntimeException("STUDENT role not found"));
            User newUser = User.builder()
                    .firstName(fn)
                    .lastName(ln)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .emailVerified(true)
                    .active(true)
                    .roles(new HashSet<>(Set.of(studentRole)))
                    .build();
            return userRepository.save(newUser);
        });

        var userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateAccessToken(userDetails);

        String roles = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("STUDENT");

        String redirectUrl = frontendUrl + "/oauth2/callback"
                + "?token=" + token
                + "&roles=" + roles
                + "&firstName=" + URLEncoder.encode(user.getFirstName(), StandardCharsets.UTF_8)
                + "&lastName="  + URLEncoder.encode(user.getLastName(),  StandardCharsets.UTF_8)
                + "&email="     + URLEncoder.encode(user.getEmail(),     StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
