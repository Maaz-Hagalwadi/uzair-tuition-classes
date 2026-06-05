package com.uzairtuition.user;

import com.uzairtuition.user.dto.ChangePasswordRequest;
import com.uzairtuition.user.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public UserResponse getProfile(Principal principal) {
        return profileService.getProfile(principal.getName());
    }

    @PutMapping
    public UserResponse updateProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest req) {
        return profileService.updateProfile(principal.getName(), req);
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        profileService.changePassword(principal.getName(), req);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
