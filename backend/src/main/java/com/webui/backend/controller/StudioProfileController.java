package com.webui.backend.controller;

import com.webui.backend.model.StudioProfileEntity;
import com.webui.backend.repository.StudioProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/studio-profile")
public class StudioProfileController {

    private static final String DEFAULT_OFFICES_JSON =
            "[{\"id\":\"office-nagpur-hq\",\"label\":\"Nagpur Headquarters\"," +
            "\"address\":\"1st Floor, Krishna-Kunj, 90, Dharampeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022\"," +
            "\"mapsUrl\":\"https://maps.app.goo.gl/wLidaC62gQLccoNY8\",\"isPrimary\":true}]";

    private static final String DEFAULT_INSTAGRAM_URL = "https://instagram.com/dsarcheon";
    private static final String DEFAULT_FACEBOOK_URL = "https://facebook.com/dsarcheon";
    private static final String DEFAULT_LINKEDIN_URL = "https://linkedin.com/company/archeon-design-studio";

    @Autowired
    private StudioProfileRepository studioProfileRepository;

    @GetMapping
    public ResponseEntity<StudioProfileEntity> getStudioProfile() {
        return studioProfileRepository.findAll().stream().findFirst()
                .map(entity -> {
                    if (entity.getInstagramUrl() == null) entity.setInstagramUrl(DEFAULT_INSTAGRAM_URL);
                    if (entity.getFacebookUrl() == null) entity.setFacebookUrl(DEFAULT_FACEBOOK_URL);
                    if (entity.getLinkedinUrl() == null) entity.setLinkedinUrl(DEFAULT_LINKEDIN_URL);
                    return ResponseEntity.ok(entity);
                })
                .orElseGet(() -> ResponseEntity.ok(
                        StudioProfileEntity.builder()
                                .principalName("Ar. Mandar Bhalekar")
                                .phone("+91 9834653481")
                                .email("dsarcheon@gmail.com")
                                .socialHandle("@mbs_archeon_ds")
                                .instagramUrl(DEFAULT_INSTAGRAM_URL)
                                .facebookUrl(DEFAULT_FACEBOOK_URL)
                                .linkedinUrl(DEFAULT_LINKEDIN_URL)
                                .officesJson(DEFAULT_OFFICES_JSON)
                                .build()
                ));
    }

    @PutMapping
    public ResponseEntity<StudioProfileEntity> updateStudioProfile(@RequestBody StudioProfileEntity updated) {
        StudioProfileEntity saved = studioProfileRepository.findAll().stream().findFirst().map(existing -> {
            if (updated.getPrincipalName() != null) existing.setPrincipalName(updated.getPrincipalName());
            if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
            if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
            if (updated.getSocialHandle() != null) existing.setSocialHandle(updated.getSocialHandle());
            if (updated.getInstagramUrl() != null) existing.setInstagramUrl(updated.getInstagramUrl());
            if (updated.getFacebookUrl() != null) existing.setFacebookUrl(updated.getFacebookUrl());
            if (updated.getLinkedinUrl() != null) existing.setLinkedinUrl(updated.getLinkedinUrl());
            if (updated.getOfficesJson() != null) existing.setOfficesJson(updated.getOfficesJson());
            return studioProfileRepository.save(existing);
        }).orElseGet(() -> studioProfileRepository.save(StudioProfileEntity.builder()
                .principalName(updated.getPrincipalName() != null ? updated.getPrincipalName() : "Ar. Mandar Bhalekar")
                .phone(updated.getPhone() != null ? updated.getPhone() : "+91 9834653481")
                .email(updated.getEmail() != null ? updated.getEmail() : "dsarcheon@gmail.com")
                .socialHandle(updated.getSocialHandle() != null ? updated.getSocialHandle() : "@mbs_archeon_ds")
                .instagramUrl(updated.getInstagramUrl() != null ? updated.getInstagramUrl() : DEFAULT_INSTAGRAM_URL)
                .facebookUrl(updated.getFacebookUrl() != null ? updated.getFacebookUrl() : DEFAULT_FACEBOOK_URL)
                .linkedinUrl(updated.getLinkedinUrl() != null ? updated.getLinkedinUrl() : DEFAULT_LINKEDIN_URL)
                .officesJson(updated.getOfficesJson() != null ? updated.getOfficesJson() : DEFAULT_OFFICES_JSON)
                .build()));
        return ResponseEntity.ok(saved);
    }
}
