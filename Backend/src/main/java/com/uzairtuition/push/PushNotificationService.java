package com.uzairtuition.push;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import com.uzairtuition.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final FcmTokenRepository fcmTokenRepository;

    @Transactional
    public void saveToken(User user, String token) {
        if (fcmTokenRepository.existsByToken(token)) return;
        fcmTokenRepository.save(FcmToken.builder().user(user).token(token).build());
    }

    @Transactional
    public void removeToken(String token) {
        fcmTokenRepository.deleteByToken(token);
    }

    @Transactional
    public void sendToUser(Long userId, String title, String body) {
        if (FirebaseApp.getApps().isEmpty()) { log.warn("FCM skipped — Firebase not initialised"); return; }
        List<String> tokens = fcmTokenRepository.findTokensByUserId(userId);
        log.info("FCM sending to userId={} tokens={} title='{}'", userId, tokens.size(), title);
        if (tokens.isEmpty()) return;
        try {
            MulticastMessage message = MulticastMessage.builder()
                    .putData("title", title)
                    .putData("body", body)
                    .addAllTokens(tokens)
                    .build();
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.info("FCM result: success={} failure={}", response.getSuccessCount(), response.getFailureCount());
            List<String> invalid = new java.util.ArrayList<>();
            List<SendResponse> responses = response.getResponses();
            for (int i = 0; i < responses.size(); i++) {
                if (!responses.get(i).isSuccessful()) {
                    log.warn("FCM token failed: {}", responses.get(i).getException().getMessage());
                    invalid.add(tokens.get(i));
                }
            }
            if (!invalid.isEmpty()) fcmTokenRepository.deleteAllByTokenIn(invalid);
        } catch (Exception e) {
            log.warn("FCM multicast failed: {}", e.getMessage());
        }
    }
}
