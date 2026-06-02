package com.uzairtuition.auth;

import com.uzairtuition.auth.dto.AuthResponse;
import com.uzairtuition.auth.dto.AuthResult;
import com.uzairtuition.auth.dto.LoginRequest;
import com.uzairtuition.exception.BadRequestException;
import com.uzairtuition.security.JwtService;
import com.uzairtuition.user.User;
import com.uzairtuition.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String accessToken = jwtService.generateAccessToken(toUserDetails(user));
        String refreshToken = createRefreshToken(user);

        return new AuthResult(buildResponse(accessToken, user), refreshToken);
    }

    @Transactional
    public AuthResult refresh(String tokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token expired, please login again");
        }

        User user = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(toUserDetails(user));

        return new AuthResult(buildResponse(accessToken, user), tokenValue);
    }

    @Transactional
    public void logout(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build();
        return refreshTokenRepository.save(token).getToken();
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRoles().stream()
                        .map(r -> "ROLE_" + r.getName())
                        .toArray(String[]::new))
                .build();
    }

    private AuthResponse buildResponse(String accessToken, User user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toSet());
        return new AuthResponse(accessToken, user.getFirstName(), user.getLastName(), user.getEmail(), roles);
    }
}
