package com.uzairtuition.push;

import com.uzairtuition.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_fcm_tokens")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FcmToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 500)
    private String token;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist  void prePersist()  { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate   void preUpdate()   { updatedAt = LocalDateTime.now(); }
}
