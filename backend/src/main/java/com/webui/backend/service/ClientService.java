package com.webui.backend.service;

import com.webui.backend.dto.identity.ClientDto.*;
import com.webui.backend.dto.identity.InvitationDto.InvitationResponse;
import com.webui.backend.dto.identity.InvitationDto.InviteUserRequest;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.RefreshTokenRepository;
import com.webui.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private ClientRepository clientRepository;

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

    private boolean isInternalStaff(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_STAFF") ||
                a.getAuthority().startsWith("ROLE_FINANCE_"));
    }

    private void validateClientAccess(ClientEntity client, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        if (isInternalStaff(auth.getAuthorities())) {
            return;
        }

        String username = auth.getName();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);

        boolean isAssignedClientUser = userOpt.isPresent() &&
                client.getId().equals(userOpt.get().getClientId());

        boolean isMatchingReferenceOrEmail = username.equalsIgnoreCase(client.getClientReference()) ||
                username.equalsIgnoreCase(client.getEmail());

        if (isAssignedClientUser || isMatchingReferenceOrEmail) {
            return;
        }

        throw new AccessDeniedException("Access denied: You are not authorized to view or mutate client " + client.getClientReference());
    }

    private String generateClientReference() {
        String ref;
        do {
            int randomNum = 1000 + SECURE_RANDOM.nextInt(9000);
            ref = "CLI-" + LocalDateTime.now().getYear() + "-" + randomNum;
        } while (clientRepository.existsByClientReference(ref));
        return ref;
    }

    private ClientResponse toResponse(ClientEntity entity) {
        return ClientResponse.builder()
                .id(entity.getId())
                .clientReference(entity.getClientReference())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .organization(entity.getOrganization())
                .location(entity.getLocation())
                .status(entity.getStatus())
                .portalAccess(entity.getPortalAccess())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                .build();
    }

    @Transactional
    public ClientResponse createClient(CreateClientRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can register new clients");
        }

        if (!StringUtils.hasText(req.getFullName())) {
            throw new IllegalArgumentException("Full name is mandatory");
        }
        if (!StringUtils.hasText(req.getEmail())) {
            throw new IllegalArgumentException("Email is mandatory");
        }
        if (!StringUtils.hasText(req.getPhone())) {
            throw new IllegalArgumentException("Phone number is mandatory");
        }

        if (clientRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("A client with this email already exists: " + req.getEmail());
        }

        String ref = StringUtils.hasText(req.getClientReference())
                ? req.getClientReference().trim().toUpperCase()
                : generateClientReference();

        if (clientRepository.existsByClientReference(ref)) {
            throw new IllegalArgumentException("Client reference already in use: " + ref);
        }

        ClientEntity client = ClientEntity.builder()
                .clientReference(ref)
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .phone(req.getPhone().trim())
                .organization(req.getOrganization())
                .location(req.getLocation())
                .notes(req.getNotes())
                .status("ACTIVE")
                .portalAccess("NOT_INVITED")
                .createdAt(LocalDateTime.now())
                .build();

        ClientEntity saved = clientRepository.save(client);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("CLIENT_CREATED")
                .entityName("Client")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"email\": \"%s\"}", ref, saved.getEmail()))
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(UUID clientId, Authentication auth) {
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        validateClientAccess(client, auth);
        return toResponse(client);
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientByReference(String reference, Authentication auth) {
        ClientEntity client = clientRepository.findByClientReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + reference));

        validateClientAccess(client, auth);
        return toResponse(client);
    }

    @Transactional(readOnly = true)
    public ClientResponse getCurrentClientProfile(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User account not found"));

        if (user.getClientId() == null) {
            // Check if username matches a client reference
            return clientRepository.findByClientReference(username)
                    .or(() -> clientRepository.findByEmail(username))
                    .map(this::toResponse)
                    .orElseThrow(() -> new AccessDeniedException("Principal is not mapped to an active client organization"));
        }

        ClientEntity client = clientRepository.findById(user.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Linked client organization not found: " + user.getClientId()));

        return toResponse(client);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> listClients(Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can view full client roster");
        }
        return clientRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClientResponse updateClient(UUID clientId, UpdateClientRequest req, Authentication auth) {
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        validateClientAccess(client, auth);

        if (StringUtils.hasText(req.getFullName())) {
            client.setFullName(req.getFullName().trim());
        }
        if (StringUtils.hasText(req.getPhone())) {
            client.setPhone(req.getPhone().trim());
        }
        if (req.getOrganization() != null) {
            client.setOrganization(req.getOrganization().trim());
        }
        if (req.getLocation() != null) {
            client.setLocation(req.getLocation().trim());
        }
        // Only staff can update internal notes
        if (req.getNotes() != null && isInternalStaff(auth.getAuthorities())) {
            client.setNotes(req.getNotes().trim());
        }

        client.setUpdatedAt(LocalDateTime.now());
        ClientEntity saved = clientRepository.save(client);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole(isInternalStaff(auth.getAuthorities()) ? "STAFF" : "CLIENT")
                .action("CLIENT_UPDATED")
                .entityName("Client")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"reference\": \"%s\"}", saved.getClientReference()))
                .build());

        return toResponse(saved);
    }

    @Transactional
    public ClientResponse updateClientStatus(UUID clientId, UpdateClientStatusRequest req, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only administrators and studio staff can modify client status");
        }

        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        String newStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : null;
        if (!"ACTIVE".equals(newStatus) && !"INACTIVE".equals(newStatus) && !"SUSPENDED".equals(newStatus)) {
            throw new IllegalArgumentException("Invalid client status. Must be ACTIVE, INACTIVE, or SUSPENDED.");
        }

        client.setStatus(newStatus);
        client.setUpdatedAt(LocalDateTime.now());

        // Invariant: If client is suspended, disable all linked user accounts and revoke sessions immediately
        if ("SUSPENDED".equals(newStatus)) {
            List<UserEntity> linkedUsers = userRepository.findByClientId(clientId);
            for (UserEntity user : linkedUsers) {
                user.setEnabled(false);
                user.setStatus("SUSPENDED");
                user.setTokenVersion(user.getTokenVersion() + 1);
                userRepository.save(user);

                refreshTokenRepository.revokeAllForUser(user.getUsername());
                tokenRevocationService.revokeAllForUser(user.getUsername());
            }
        }

        ClientEntity saved = clientRepository.save(client);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("CLIENT_STATUS_UPDATED")
                .entityName("Client")
                .entityId(saved.getId().toString())
                .detailsJson(String.format("{\"newStatus\": \"%s\"}", newStatus))
                .build());

        return toResponse(saved);
    }

    public InvitationResponse inviteClient(UUID clientId, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can invite client users");
        }

        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        InviteUserRequest inviteReq = InviteUserRequest.builder()
                .email(client.getEmail())
                .recipientName(client.getFullName())
                .targetRole("ROLE_CLIENT")
                .clientId(clientId)
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse response = userInvitationService.createInvitation(inviteReq, auth);

        updateClientPortalStatus(clientId, "INVITATION_PENDING");

        return response;
    }

    @Transactional
    public void updateClientPortalStatus(UUID clientId, String portalAccess) {
        clientRepository.findById(clientId).ifPresent(c -> {
            c.setPortalAccess(portalAccess);
            c.setUpdatedAt(LocalDateTime.now());
            clientRepository.save(c);
        });
    }

    @Transactional
    public void deleteClient(UUID clientId, Authentication auth) {
        if (!isInternalStaff(auth.getAuthorities())) {
            throw new AccessDeniedException("Only studio administrators and staff can delete clients");
        }
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        List<UserEntity> linkedUsers = userRepository.findByClientId(clientId);
        for (UserEntity user : linkedUsers) {
            user.setEnabled(false);
            user.setStatus("DELETED");
            refreshTokenRepository.revokeAllForUser(user.getUsername());
            tokenRevocationService.revokeAllForUser(user.getUsername());
            userRepository.delete(user);
        }

        clientRepository.delete(client);

        auditEventRepository.save(AuditEventEntity.builder()
                .actorId(auth.getName())
                .actorRole("STAFF")
                .action("CLIENT_DELETED")
                .entityName("Client")
                .entityId(clientId.toString())
                .detailsJson(String.format("{\"reference\": \"%s\", \"email\": \"%s\"}", client.getClientReference(), client.getEmail()))
                .build());
    }
}
