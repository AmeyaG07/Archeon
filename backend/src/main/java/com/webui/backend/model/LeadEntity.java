package com.webui.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "leads")
public class LeadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String clientName;

    @Column(nullable = false)
    private String phone;

    private String email;

    @Column(nullable = false)
    private String serviceDiscipline; // ARCHITECTURE, INTERIOR, LANDSCAPE, VIZ, TURNKEY

    private String location;

    private String budgetBand;

    private String estimatedTimeline;

    @Column(length = 2000)
    private String projectBrief;

    @Column(nullable = false)
    private Boolean whatsappOptIn = false;

    private Instant optInTimestamp;

    private String status = "NEW_ENQUIRY"; // NEW_ENQUIRY, CONTACTED, ESTIMATE_SENT, CONVERTED, ARCHIVED

    private Instant createdAt = Instant.now();

    public LeadEntity() {}

    public LeadEntity(String clientName, String phone, String email, String serviceDiscipline,
                      String location, String budgetBand, String estimatedTimeline,
                      String projectBrief, Boolean whatsappOptIn) {
        this.clientName = clientName;
        this.phone = phone;
        this.email = email;
        this.serviceDiscipline = serviceDiscipline;
        this.location = location;
        this.budgetBand = budgetBand;
        this.estimatedTimeline = estimatedTimeline;
        this.projectBrief = projectBrief;
        this.whatsappOptIn = whatsappOptIn != null ? whatsappOptIn : false;
        if (Boolean.TRUE.equals(this.whatsappOptIn)) {
            this.optInTimestamp = Instant.now();
        }
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getServiceDiscipline() { return serviceDiscipline; }
    public void setServiceDiscipline(String serviceDiscipline) { this.serviceDiscipline = serviceDiscipline; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBudgetBand() { return budgetBand; }
    public void setBudgetBand(String budgetBand) { this.budgetBand = budgetBand; }

    public String getEstimatedTimeline() { return estimatedTimeline; }
    public void setEstimatedTimeline(String estimatedTimeline) { this.estimatedTimeline = estimatedTimeline; }

    public String getProjectBrief() { return projectBrief; }
    public void setProjectBrief(String projectBrief) { this.projectBrief = projectBrief; }

    public Boolean getWhatsappOptIn() { return whatsappOptIn; }
    public void setWhatsappOptIn(Boolean whatsappOptIn) {
        this.whatsappOptIn = whatsappOptIn;
        if (Boolean.TRUE.equals(whatsappOptIn) && this.optInTimestamp == null) {
            this.optInTimestamp = Instant.now();
        }
    }

    public Instant getOptInTimestamp() { return optInTimestamp; }
    public void setOptInTimestamp(Instant optInTimestamp) { this.optInTimestamp = optInTimestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
