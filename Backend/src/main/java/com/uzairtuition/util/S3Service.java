package com.uzairtuition.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${app.aws.s3.bucket}")
    private String bucket;

    @Value("${app.aws.region}")
    private String region;

    @Value("${app.aws.access-key}")
    private String accessKey;

    public String upload(MultipartFile file, String folder) {
        if (accessKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "File upload is not configured. Set AWS credentials in environment variables.");
        }
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String key = folder + "/" + UUID.randomUUID() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            log.error("Failed to read upload file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read file.");
        } catch (Exception e) {
            log.error("S3 upload failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed: " + e.getMessage());
        }

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }
}
