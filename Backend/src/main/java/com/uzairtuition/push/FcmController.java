package com.uzairtuition.push;

import com.uzairtuition.user.UserRepository;
import com.uzairtuition.util.EntityFinder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class FcmController {

    private final PushNotificationService pushService;
    private final UserRepository userRepository;

    @PostMapping("/api/user/fcm-token")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@Valid @RequestBody FcmTokenRequest req, Principal principal) {
        var user = EntityFinder.findOrThrow(userRepository.findByEmail(principal.getName()), "User");
        pushService.saveToken(user, req.token());
    }

    @DeleteMapping("/api/user/fcm-token")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@Valid @RequestBody FcmTokenRequest req) {
        pushService.removeToken(req.token());
    }
}
