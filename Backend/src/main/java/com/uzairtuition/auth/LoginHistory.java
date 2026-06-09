package com.uzairtuition.auth;

import com.uzairtuition.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ip_address", length = 60)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(length = 80)
    private String browser;

    @Column(length = 80)
    private String os;

    @Column(length = 20)
    private String device;

    @Column(name = "logged_in_at", updatable = false)
    private LocalDateTime loggedInAt;

    @PrePersist
    protected void onCreate() {
        loggedInAt = LocalDateTime.now();
    }
}
