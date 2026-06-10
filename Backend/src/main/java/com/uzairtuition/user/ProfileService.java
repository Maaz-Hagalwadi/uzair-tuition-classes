package com.uzairtuition.user;

import com.uzairtuition.user.dto.ChangePasswordRequest;
import com.uzairtuition.user.dto.UpdateProfileRequest;
import com.uzairtuition.util.EntityFinder;
import com.uzairtuition.util.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service;

    public UserResponse getProfile(String email) {
        return UserResponse.from(EntityFinder.findOrThrow(userRepository.findByEmail(email), "User"));
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = EntityFinder.findOrThrow(userRepository.findByEmail(email), "User");
        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setPhone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse uploadProfilePicture(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed.");
        }
        User user = EntityFinder.findOrThrow(userRepository.findByEmail(email), "User");
        String url = s3Service.upload(file, "profile-pictures");
        user.setProfilePictureUrl(url);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest req) {
        User user = EntityFinder.findOrThrow(userRepository.findByEmail(email), "User");
        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }
}
