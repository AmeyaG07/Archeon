package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "studio_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String principalName;

    private String phone;

    private String email;

    private String socialHandle;

    private String instagramUrl;

    private String facebookUrl;

    private String linkedinUrl;

    @Column(columnDefinition = "TEXT")
    private String officesJson;
}
