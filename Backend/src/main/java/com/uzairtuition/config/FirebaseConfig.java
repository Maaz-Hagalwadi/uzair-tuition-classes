package com.uzairtuition.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
@Lazy(false)
@Slf4j
public class FirebaseConfig {

    @Value("${app.firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${app.firebase.service-account:}")
    private String serviceAccountJson;

    @PostConstruct
    public void init() {
        try {
            InputStream stream = resolveStream();
            if (stream == null) {
                log.info("Firebase not configured — push notifications disabled");
                return;
            }
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialised");
            }
        } catch (Exception e) {
            log.warn("Firebase init failed: {} {}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private InputStream resolveStream() throws Exception {
        if (!serviceAccountPath.isBlank()) {
            var path = Paths.get(serviceAccountPath);
            if (!Files.exists(path)) {
                log.warn("Firebase service account file not found: {}", serviceAccountPath);
                return null;
            }
            return new FileInputStream(path.toFile());
        }
        if (!serviceAccountJson.isBlank()) {
            return new ByteArrayInputStream(serviceAccountJson.getBytes());
        }
        return null;
    }
}
