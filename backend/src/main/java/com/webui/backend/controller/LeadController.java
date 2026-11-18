package com.webui.backend.controller;

import com.webui.backend.model.LeadEntity;
import com.webui.backend.repository.LeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "*")
public class LeadController {

    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitLead(@RequestBody LeadSubmissionRequest req) {
        if (req.clientName() == null || req.clientName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Client name is mandatory"));
        }
        if (req.phone() == null || req.phone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is mandatory"));
        }

        LeadEntity lead = new LeadEntity(
                req.clientName(),
                req.phone(),
                req.email(),
                req.serviceDiscipline() != null ? req.serviceDiscipline() : "ARCHITECTURE",
                req.location(),
                req.budgetBand(),
                req.estimatedTimeline(),
                req.projectBrief(),
                req.whatsappOptIn()
        );

        LeadEntity saved = leadRepository.save(lead);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "leadId", saved.getId(),
                "message", "Consultation enquiry received. Studio will contact you within 24-48 business hours.",
                "whatsappOptInRecorded", saved.getWhatsappOptIn()
        ));
    }

    @GetMapping
    public ResponseEntity<List<LeadEntity>> getAllLeads() {
        return ResponseEntity.ok(leadRepository.findAllByOrderByCreatedAtDesc());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status field is required"));
        }

        return leadRepository.findById(id).map(lead -> {
            lead.setStatus(newStatus);
            leadRepository.save(lead);
            return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record LeadSubmissionRequest(
            String clientName,
            String phone,
            String email,
            String serviceDiscipline,
            String location,
            String budgetBand,
            String estimatedTimeline,
            String projectBrief,
            Boolean whatsappOptIn
    ) {}
}
