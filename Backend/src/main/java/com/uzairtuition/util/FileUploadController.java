package com.uzairtuition.util;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/upload")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
@RequiredArgsConstructor
public class FileUploadController {

    private static final long MAX_SIZE = 50 * 1024 * 1024L; // 50 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "video/mp4", "video/webm", "video/quicktime",
            "image/jpeg", "image/png", "image/webp",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final S3Service s3Service;

    @PostMapping
    public Map<String, String> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "materials") String folder) {

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds 50 MB limit.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File type not allowed. Supported: PDF, video, images, Word, PowerPoint.");
        }

        String url = s3Service.upload(file, folder);
        return Map.of("url", url);
    }
}
