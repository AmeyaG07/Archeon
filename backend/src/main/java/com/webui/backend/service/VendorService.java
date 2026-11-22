package com.webui.backend.service;

import com.webui.backend.dto.identity.InvitationDto.InvitationResponse;
import com.webui.backend.dto.identity.InvitationDto.InviteUserRequest;
import com.webui.backend.dto.identity.VendorDto.*;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.RefreshTokenRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import com.webui.backend.security.crypto.SensitiveDataMasker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VendorService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "CARPENTRY", "ELECTRICAL", "CIVIL_WORK", "HVAC", "PLUMBING",
            "FABRICATION", "MASONRY", "PAINTING", "LANDSCAPING", "LIGHTING", "FINISHING", "OTHER"
    );

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private TokenRevocationService tokenRevocationService;

    @Autowired
    private UserInvitationService userInvitationService;

    @Autowired
    private SensitiveDataMasker sensitiveDataMasker;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private boolean isInternalStaff(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_STAFF") ||
                a.getAuthority().startsWith("ROLE_FINANCE_"));
    }

    private boolean isPrivilegedOrOwner(VendorEntity vendor, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        if (sensitiveDataMasker.isPrivilegedFinancialUser(auth.getAuthorities())) {
            return true;
        }
        if (vendor == null || vendor.getId() == null) {
            return false;
        }
        String username = auth.getName();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        boolean isAssignedVendorUser = userOpt.isPresent() &&
                vendor.getId().equals(userOpt.get().getVendorId());
        boolean isMatchingReferenceOrEmail = username.equalsIgnoreCase(vendor.getVendorReference()) ||
                username.equalsIgnoreCase(vendor.getEmail());

        return isAssignedVendorUser || isMatchingReferenceOrEmail;
    }

    private void validateVendorAccess(VendorEntity vendor, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        if (isInternalStaff(auth.getAuthorities())) {
            return;
        }

        String username = auth.getName();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);

        boolean isAssignedVendorUser = userOpt.isPresent() &&
                vendor.getId().equals(userOpt.get().getVendorId());

        boolean isMatchingReferenceOrEmail = username.equalsIgnoreCase(vendor.getVendorReference()) ||
                username.equalsIgnoreCase(vendor.getEmail());

        if (isAssignedVendorUser || isMatchingReferenceOrEmail) {
            return;
        }

        throw new AccessDeniedException("Access denied: You are not authorized to view or mutate vendor " + vendor.getVendorReference());
    }

    private String generateVendorReference() {
        String ref;
        do {
            int randomNum = 1000 + SECURE_RANDOM.nextInt(9000);
            ref = "VND-" + LocalDateTime.now().getYear() + "-" + randomNum;
        } while (vendorRepository.existsByVendorReference(ref));
        return ref;
    }

    private VendorResponse toResponse(VendorEntity entity) {
        return toResponse(entity, null);
    }

    private VendorResponse toResponse(VendorEntity entity, Authentication auth) {
        if (entity == null) {
            return null;
        }

        boolean canSeeUnmasked = isPrivilegedOrOwner(entity, auth);

        String pan = entity.getPan();
        String gstin = entity.getGstin();
        String bankDetailsJson = entity.getBankDetailsJson();

        if (!canSeeUnmasked) {
            pan = sensitiveDataMasker.maskPan(pan);
            gstin = sensitiveDataMasker.maskGstin(gstin);
            bankDetailsJson = sensitiveDataMasker.maskBankDetailsJson(bankDetailsJson);
        }

        return VendorResponse.builder()
                .id(entity.getId())
                .vendorReference(entity.getVendorReference())
                .businessName(entity.getBusinessName())
                .contactPerson(entity.getContactPerson())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .category(entity.getCategory())
                .location(entity.getLocation())
                .gstin(gstin)
                .pan(pan)
                .bankDetailsJson(bankDetailsJson)
                .status(entity.getStatus())
                .portalAccess(entity.getPortalAccess())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                .build();
    }

    @Transactional
    public VendorResponse createVendor(CreateVendorRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can register new vendors");
        }

        if (!StringUtils.hasText(req.getBusinessName())) {
            throw new IllegalArgumentException("Business name is mandatory");
        }
        if (!StringUtils.hasText(req.getContactPerson())) {
            throw new IllegalArgumentException("Contact person is mandatory");
        }
        if (!StringUtils.hasText(req.getEmail())) {
            throw new IllegalArgumentException("Email is mandatory");
        }
        if (!StringUtils.hasText(req.getPhone())) {
            throw new IllegalArgumentException("Phone number is mandatory");
        }
        if (!StringUtils.hasText(req.getCategory())) {
            throw new IllegalArgumentException("Vendor trade category is mandatory");
        }

        String categoryUpper = req.getCategory().trim().toUpperCase();
        if (!ALLOWED_CATEGORIES.contains(categoryUpper)) {
            throw new IllegalArgumentException("Invalid vendor category: " + req.getCategory() +
                    ". Allowed categories: " + ALLOWED_CATEGORIES);
        }

        if (vendorRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("A vendor with this email already exists: " + req.getEmail());
        }

        String ref = StringUtils.hasText(req.getVendorReference())
                ? req.getVendorReference().trim().toUpperCase()
                : generateVendorReference();

        if (vendorRepository.existsByVendorReference(ref)) {
            throw new IllegalArgumentException("Vendor reference already in use: " + ref);
        }

        VendorEntity vendor = VendorEntity.builder()
                .vendorReference(ref)
                .businessName(req.getBusinessName().trim())
                .contactPerson(req.getContactPerson().trim())
                .email(req.getEmail().trim().toLowerCase())
                .phone(req.getPhone().trim())
                .category(categoryUpper)
                .location(req.getLocation())
                .gstin(req.getGstin() != null ? req.getGstin().trim().toUpperCase() : null)
                .pan(req.getPan() != null ? req.getPan().trim().toUpperCase() : null)
                .bankDetailsJson(req.getBankDetailsJson())
                .notes(req.getNotes())
                .status("ACTIVE")
                .portalAccess("NOT_INVITED")
                .createdAt(LocalDateTime.now())
                .build();

        VendorEntity saved = vendorRepository.save(vendor);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("VENDOR_CREATED")
                .entityName("Vendor")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"business\": \"%s\"}", ref, saved.getBusinessName()))
                .build());

        return toResponse(saved, auth);
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorById(UUID vendorId, Authentication auth) {
        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        validateVendorAccess(vendor, auth);
        return toResponse(vendor, auth);
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorByReference(String reference, Authentication auth) {
        VendorEntity vendor = vendorRepository.findByVendorReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + reference));

        validateVendorAccess(vendor, auth);
        return toResponse(vendor, auth);
    }

    @Transactional(readOnly = true)
    public VendorResponse getCurrentVendorProfile(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User account not found"));

        if (user.getVendorId() == null) {
            return vendorRepository.findByVendorReference(username)
                    .or(() -> vendorRepository.findByEmail(username))
                    .map(v -> toResponse(v, auth))
                    .orElseThrow(() -> new AccessDeniedException("Principal is not mapped to an active vendor organization"));
        }

        VendorEntity vendor = vendorRepository.findById(user.getVendorId())
                .orElseThrow(() -> new IllegalArgumentException("Linked vendor organization not found: " + user.getVendorId()));

        return toResponse(vendor, auth);
    }

    @Transactional
    public VendorResponse updateCurrentVendorProfile(UpdateVendorRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User account not found"));

        VendorEntity vendor = null;
        if (user.getVendorId() != null) {
            vendor = vendorRepository.findById(user.getVendorId()).orElse(null);
        }
        if (vendor == null) {
            vendor = vendorRepository.findByVendorReference(username)
                    .or(() -> vendorRepository.findByEmail(username))
                    .orElseThrow(() -> new AccessDeniedException("Principal is not mapped to an active vendor organization"));
        }

        if (StringUtils.hasText(req.getBusinessName())) {
            vendor.setBusinessName(req.getBusinessName().trim());
        }
        if (StringUtils.hasText(req.getContactPerson())) {
            vendor.setContactPerson(req.getContactPerson().trim());
        }
        if (StringUtils.hasText(req.getPhone())) {
            vendor.setPhone(req.getPhone().trim());
        }
        if (req.getLocation() != null) {
            vendor.setLocation(req.getLocation().trim());
        }
        if (req.getGstin() != null) {
            vendor.setGstin(req.getGstin().trim().toUpperCase());
        }
        if (req.getBankDetailsJson() != null) {
            vendor.setBankDetailsJson(req.getBankDetailsJson().trim());
        }
        vendor.setUpdatedAt(LocalDateTime.now());
        VendorEntity saved = vendorRepository.save(vendor);
        return toResponse(saved, auth);
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> listVendors(Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can view full vendor roster");
        }
        return vendorRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(v -> toResponse(v, auth))
                .collect(Collectors.toList());
    }

    @Transactional
    public VendorResponse updateVendor(UUID vendorId, UpdateVendorRequest req, Authentication auth) {
        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        validateVendorAccess(vendor, auth);

        if (StringUtils.hasText(req.getBusinessName())) {
            vendor.setBusinessName(req.getBusinessName().trim());
        }
        if (StringUtils.hasText(req.getContactPerson())) {
            vendor.setContactPerson(req.getContactPerson().trim());
        }
        if (StringUtils.hasText(req.getPhone())) {
            vendor.setPhone(req.getPhone().trim());
        }
        if (StringUtils.hasText(req.getCategory())) {
            String cat = req.getCategory().trim().toUpperCase();
            if (ALLOWED_CATEGORIES.contains(cat)) {
                vendor.setCategory(cat);
            }
        }
        if (req.getLocation() != null) {
            vendor.setLocation(req.getLocation().trim());
        }
        if (req.getGstin() != null) {
            vendor.setGstin(req.getGstin().trim().toUpperCase());
        }
        if (req.getPan() != null) {
            vendor.setPan(req.getPan().trim().toUpperCase());
        }
        if (req.getBankDetailsJson() != null) {
            vendor.setBankDetailsJson(req.getBankDetailsJson().trim());
        }
        if (req.getNotes() != null && isInternalStaff(auth.getAuthorities())) {
            vendor.setNotes(req.getNotes().trim());
        }

        vendor.setUpdatedAt(LocalDateTime.now());
        VendorEntity saved = vendorRepository.save(vendor);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole(isInternalStaff(auth.getAuthorities()) ? "STAFF" : "VENDOR")
                .action("VENDOR_UPDATED")
                .entityName("Vendor")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\"}", saved.getVendorReference()))
                .build());

        return toResponse(saved, auth);
    }

    @Transactional
    public VendorResponse updateVendorStatus(UUID vendorId, UpdateVendorStatusRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only administrators and studio staff can modify vendor status");
        }

        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!"ACTIVE".equals(newStatus) && !"INACTIVE".equals(newStatus) && !"SUSPENDED".equals(newStatus)) {
            throw new IllegalArgumentException("Invalid vendor status. Must be ACTIVE, INACTIVE, or SUSPENDED.");
        }

        vendor.setStatus(newStatus);
        vendor.setUpdatedAt(LocalDateTime.now());

        if ("SUSPENDED".equals(newStatus)) {
            List<UserEntity> linkedUsers = userRepository.findByVendorId(vendorId);
            for (UserEntity user : linkedUsers) {
                user.setEnabled(false);
                user.setStatus("SUSPENDED");
                user.setTokenVersion(user.getTokenVersion() + 1);
                userRepository.save(user);

                refreshTokenRepository.revokeAllForUser(user.getUsername());
                tokenRevocationService.revokeAllForUser(user.getUsername());
            }
        }

        VendorEntity saved = vendorRepository.save(vendor);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("VENDOR_STATUS_UPDATED")
                .entityName("Vendor")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"newStatus\": \"%s\"}", newStatus))
                .build());

        return toResponse(saved, auth);
    }

    @Transactional
    public InvitationResponse inviteVendor(UUID vendorId, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can invite vendor users");
        }

        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        InviteUserRequest inviteReq = InviteUserRequest.builder()
                .email(vendor.getEmail())
                .recipientName(vendor.getBusinessName())
                .targetRole("ROLE_VENDOR")
                .vendorId(vendorId)
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse response = userInvitationService.createInvitation(inviteReq, auth);

        updateVendorPortalStatus(vendorId, "INVITATION_PENDING");

        return response;
    }

    @Transactional
    public void updateVendorPortalStatus(UUID vendorId, String portalAccess) {
        vendorRepository.findById(vendorId).ifPresent(v -> {
            v.setPortalAccess(portalAccess);
            v.setUpdatedAt(LocalDateTime.now());
            vendorRepository.save(v);
        });
    }

    @Transactional
    public void deleteVendor(UUID vendorId, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can delete vendors");
        }
        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        List<UserEntity> linkedUsers = userRepository.findByVendorId(vendorId);
        for (UserEntity user : linkedUsers) {
            user.setEnabled(false);
            user.setStatus("DELETED");
            refreshTokenRepository.revokeAllForUser(user.getUsername());
            tokenRevocationService.revokeAllForUser(user.getUsername());
            userRepository.delete(user);
        }

        vendorRepository.delete(vendor);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("VENDOR_DELETED")
                .entityName("Vendor")
                .entityId(vendorId.toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"email\": \"%s\"}", vendor.getVendorReference(), vendor.getEmail()))
                .build());
    }

    @Transactional
    public java.util.Map<String, Object> createPortalAccount(UUID vendorId, CreatePortalAccountRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can create portal accounts");
        }
        VendorEntity vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        String username = org.springframework.util.StringUtils.hasText(req.getUsername())
                ? req.getUsername().trim()
                : vendor.getEmail();
        String rawPassword = org.springframework.util.StringUtils.hasText(req.getPassword())
                ? req.getPassword().trim()
                : "Password123!";

        java.util.Optional<UserEntity> existingOpt = userRepository.findByUsername(username);
        UserEntity user;
        if (existingOpt.isPresent()) {
            user = existingOpt.get();
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setVendorId(vendorId);
            user.setRole("ROLE_VENDOR");
            user.setEnabled(true);
            user.setStatus("ACTIVE");
        } else {
            user = UserEntity.builder()
                    .username(username)
                    .password(passwordEncoder.encode(rawPassword))
                    .role("ROLE_VENDOR")
                    .email(vendor.getEmail())
                    .fullName(vendor.getContactPerson())
                    .phone(vendor.getPhone())
                    .vendorId(vendorId)
                    .status("ACTIVE")
                    .enabled(true)
                    .tokenVersion(0L)
                    .build();
        }
        userRepository.save(user);

        vendor.setPortalAccess("ACTIVE");
        vendor.setUpdatedAt(LocalDateTime.now());
        vendorRepository.save(vendor);

        return java.util.Map.of(
                "success", true,
                "username", username,
                "role", "ROLE_VENDOR",
                "message", "Portal account created successfully. The vendor can now log in at /login."
        );
    }
}
