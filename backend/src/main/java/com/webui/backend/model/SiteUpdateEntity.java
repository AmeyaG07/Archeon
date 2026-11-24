package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "site_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteUpdateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "author_role", nullable = false, length = 32)
    private String authorRole; // 'ARCHITECT', 'VENDOR'

    @Column(name = "author_name", nullable = false, length = 100)
    private String authorName;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
