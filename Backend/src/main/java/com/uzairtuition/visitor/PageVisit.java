package com.uzairtuition.visitor;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "page_visits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PageVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(length = 200)
    private String page;

    @Column(length = 500)
    private String referrer;

    @Column(name = "visited_at", updatable = false)
    private LocalDateTime visitedAt;

    @PrePersist
    protected void onCreate() {
        visitedAt = LocalDateTime.now();
    }
}
