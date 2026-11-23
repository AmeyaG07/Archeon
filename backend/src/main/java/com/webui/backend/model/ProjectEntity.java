package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectEntity {

    @Id
    private String id; // e.g. "pudgy-penguins", "overpass", "abstract"

    @Column(nullable = false)
    private String code; // e.g. "PORTFOLIO_CO_01"

    @Column(nullable = false)
    private String title;

    private String releaseDate;

    private Integer temperature; // in Celsius e.g. -3

    private String summaryTitle;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String tagsJson; // JSON array string e.g. '["IP LICENSING","WEB3"]'

    @Column(columnDefinition = "TEXT")
    private String linksJson; // JSON array string

    @Column(columnDefinition = "TEXT")
    private String socialsJson; // JSON array string

    private String accentColor; // hex code e.g. "#4B96F3"

    @Column(columnDefinition = "TEXT")
    private String image; // URL or photo path e.g. "/projects/monolith-sanctuary.png"

    private String category; // "Residential", "Interior", "Landscape", "Turnkey"

    private String location; // e.g. "Khandala, Maharashtra"

    private String area; // e.g. "8,500 sq.ft"

    private String status; // "Completed", "Under Execution"

    @Column(name = "project_year")
    private String projectYear; // e.g. "2026"
}
