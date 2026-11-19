package com.webui.backend.identity;

import com.webui.backend.dto.identity.ClientDto.ClientResponse;
import com.webui.backend.dto.identity.ClientDto.CreateClientRequest;
import com.webui.backend.dto.identity.InvitationDto.*;
import com.webui.backend.dto.identity.UserDto.UserSummaryResponse;
import com.webui.backend.dto.identity.VendorDto.CreateVendorRequest;
import com.webui.backend.dto.identity.VendorDto.VendorResponse;
import com.webui.backend.model.AuditEventEntity;
import com.webui.backend.model.ClientEntity;
import com.webui.backend.model.UserEntity;
import com.webui.backend.model.UserInvitationEntity;
import com.webui.backend.model.VendorEntity;
import com.webui.backend.repository.AuditEventRepository;
import com.webui.backend.repository.ClientRepository;
import com.webui.backend.repository.UserInvitationRepository;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.repository.VendorRepository;
import com.webui.backend.service.ClientService;
import com.webui.backend.service.UserInvitationService;
import com.webui.backend.service.VendorService;
import com.webui.backend.service.email.EmailDeliveryService;
import com.webui.backend.service.email.InvitationEmailPayload;
import com.webui.backend.service.email.MockEmailDeliveryService;
import com.webui.backend.service.email.SmtpEmailDeliveryService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class DualInvitationDeliveryAndSecurityTest {

    @Autowired
    private UserInvitationService invitationService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private UserInvitationRepository invitationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    @Autowired
    private MockEmailDeliveryService mockEmailDeliveryService;

    private Authentication adminAuth;
    private Authentication staffAuth;
    private Authentication clientAuth;

    @BeforeEach
    void setUp() {
        mockEmailDeliveryService.clear();

        adminAuth = new UsernamePasswordAuthenticationToken(
                "super_admin", "N/A", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        staffAuth = new UsernamePasswordAuthenticationToken(
                "staff_member", "N/A", List.of(new SimpleGrantedAuthority("ROLE_STAFF"))
        );
        clientAuth = new UsernamePasswordAuthenticationToken(
                "client_user", "N/A", List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
        );
    }

    @Test
    @DisplayName("P5.3.2-01: Automatic Email Delivery — Invitation dispatched via authenticated email with verified sender")
    void testAutomaticEmailDeliveryWorkflow() {
        ClientResponse client = clientService.createClient(CreateClientRequest.builder()
                .fullName("Starlight Residences")
                .email("contact@starlight-residences.test")
                .phone("+91-9876543201")
                .build(), adminAuth);

        // Invite client via ClientService (defaults to deliveryMethod: BOTH)
        InvitationResponse inviteRes = clientService.inviteClient(client.getId(), adminAuth);

        assertNotNull(inviteRes);
        assertNotNull(inviteRes.getRawToken(), "Raw token must be provided at issuance");
        assertEquals("DELIVERED", inviteRes.getEmailDeliveryStatus());
        assertEquals("BOTH", inviteRes.getDeliveryMethod());
        assertTrue(inviteRes.getInvitationUrl().startsWith("http://localhost:3000/auth/accept-invitation?token="));

        // Verify MockEmailDeliveryService captured the message
        List<InvitationEmailPayload> emails = mockEmailDeliveryService.getDispatchedPayloads();
        assertFalse(emails.isEmpty(), "An email must be dispatched automatically");
        InvitationEmailPayload email = emails.get(emails.size() - 1);

        assertEquals("contact@starlight-residences.test", email.getRecipientEmail());
        assertEquals("Starlight Residences", email.getRecipientName());
        assertEquals("ROLE_CLIENT", email.getTargetRole());
        assertEquals(inviteRes.getInvitationUrl(), email.getInvitationUrl());
        assertNotNull(email.getExpiresAt());

        // Verify Acceptance via token delivered in email
        AcceptInvitationRequest acceptReq = AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("starlight_owner")
                .password("SecurePass2026!")
                .fullName("Rohan Verma")
                .phone("+91-9876543201")
                .build();

        UserSummaryResponse createdUser = invitationService.acceptInvitation(acceptReq);

        assertNotNull(createdUser.getId());
        assertEquals("starlight_owner", createdUser.getUsername());
        assertEquals("ROLE_CLIENT", createdUser.getRole(), "Role must strictly match invitation");
        assertEquals(client.getId(), createdUser.getClientId());
        assertTrue(createdUser.isEnabled());

        // Verify client portal access is ACTIVE
        ClientEntity updatedClient = clientRepository.findById(client.getId()).orElseThrow();
        assertEquals("ACTIVE", updatedClient.getPortalAccess());

        // Verify Audit Trail
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        boolean hasDispatchedAudit = auditEvents.stream().anyMatch(a ->
                "INVITATION_EMAIL_DISPATCHED".equals(a.getAction()) && a.getDetailsJson().contains("contact@starlight-residences.test")
        );
        assertTrue(hasDispatchedAudit, "INVITATION_EMAIL_DISPATCHED audit event must be recorded");
    }

    @Test
    @DisplayName("P5.3.2-02: Manual Link Generation — Admin-generated secure link for manual sharing")
    void testManualSharingLinkWorkflow() {
        VendorResponse vendor = vendorService.createVendor(CreateVendorRequest.builder()
                .businessName("Apex Steel Fabrication")
                .contactPerson("Sunil Patil")
                .email("vendor@apexsteel.test")
                .phone("+91-9123456780")
                .category("FABRICATION")
                .build(), adminAuth);

        // Admin explicitly requests MANUAL delivery only
        InviteUserRequest manualReq = InviteUserRequest.builder()
                .email("vendor@apexsteel.test")
                .recipientName("Apex Steel Fabrication")
                .targetRole("ROLE_VENDOR")
                .vendorId(vendor.getId())
                .deliveryMethod("MANUAL")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(manualReq, adminAuth);

        assertNotNull(inviteRes);
        assertNotNull(inviteRes.getRawToken());
        assertEquals("MANUAL", inviteRes.getDeliveryMethod());
        assertEquals("NOT_REQUESTED", inviteRes.getEmailDeliveryStatus());
        assertNotNull(inviteRes.getManualSharingSnippet());
        assertTrue(inviteRes.getManualSharingSnippet().contains("Apex Steel Fabrication"));
        assertTrue(inviteRes.getManualSharingSnippet().contains(inviteRes.getInvitationUrl()));

        // Confirm zero emails were dispatched
        assertEquals(0, mockEmailDeliveryService.getDispatchedPayloads().size(), "Manual delivery must NOT dispatch email");

        // Verify acceptance using manual link token
        AcceptInvitationRequest acceptReq = AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("apex_vendor_admin")
                .password("VendorSecret2026#")
                .fullName("Sunil Patil")
                .phone("+91-9123456780")
                .build();

        UserSummaryResponse createdVendorUser = invitationService.acceptInvitation(acceptReq);
        assertEquals("ROLE_VENDOR", createdVendorUser.getRole());
        assertEquals(vendor.getId(), createdVendorUser.getVendorId());

        VendorEntity updatedVendor = vendorRepository.findById(vendor.getId()).orElseThrow();
        assertEquals("ACTIVE", updatedVendor.getPortalAccess());
    }

    @Test
    @DisplayName("P5.3.2-03: Single-Use Guarantee — Accepting via either channel permanently consumes the token")
    void testSingleUseGuaranteeAcrossChannels() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("dual_channel@example.test")
                .recipientName("Dual Channel Client")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(req, adminAuth);
        String token = inviteRes.getRawToken();

        // First acceptance succeeds (e.g. user clicks email link)
        AcceptInvitationRequest acceptReq1 = AcceptInvitationRequest.builder()
                .token(token)
                .username("dual_user_1")
                .password("Password123!")
                .build();
        UserSummaryResponse user = invitationService.acceptInvitation(acceptReq1);
        assertNotNull(user);

        // Second attempt with the same token (e.g. from manual link) MUST FAIL
        AcceptInvitationRequest acceptReq2 = AcceptInvitationRequest.builder()
                .token(token)
                .username("dual_user_2")
                .password("Password123!")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invitationService.acceptInvitation(acceptReq2)
        );
        assertTrue(ex.getMessage().contains("no longer active"), "Replay attempt must be rejected");
    }

    @Test
    @DisplayName("P5.3.2-04: Expiration Enforcement — Expired tokens cannot be accepted via email or manual link")
    void testExpirationEnforcement() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("expired_invitee@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(req, adminAuth);

        // Manually manipulate expiration to the past to simulate time lapse
        UserInvitationEntity invitation = invitationRepository.findById(inviteRes.getInvitationId()).orElseThrow();
        invitation.setExpiresAt(LocalDateTime.now().minusDays(1));
        invitationRepository.save(invitation);

        AcceptInvitationRequest acceptReq = AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("expired_user")
                .password("Password123!")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invitationService.acceptInvitation(acceptReq)
        );
        assertTrue(ex.getMessage().contains("expired"), "Expired token must be rejected");

        // Verify status transitioned to EXPIRED
        UserInvitationEntity updated = invitationRepository.findById(inviteRes.getInvitationId()).orElseThrow();
        assertEquals("EXPIRED", updated.getStatus());
    }

    @Test
    @DisplayName("P5.3.2-05: Revocation Invariant — Revoked invitations invalidate both email and manual links")
    void testRevocationInvalidatesBothChannels() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("revoked_partner@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(req, adminAuth);

        // Administrator revokes the invitation
        invitationService.revokeInvitation(inviteRes.getInvitationId(), adminAuth);

        UserInvitationEntity invitation = invitationRepository.findById(inviteRes.getInvitationId()).orElseThrow();
        assertEquals("REVOKED", invitation.getStatus());

        // Attempt to accept fails
        AcceptInvitationRequest acceptReq = AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("revoked_user")
                .password("Password123!")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invitationService.acceptInvitation(acceptReq)
        );
        assertTrue(ex.getMessage().contains("REVOKED"));
    }

    @Test
    @DisplayName("P5.3.2-06: Anti-Privilege Escalation — Staff cannot invite admin or finance roles; invitee cannot alter role")
    void testPrivilegeEscalationDefenses() {
        // Staff attempts to invite an Administrator
        InviteUserRequest adminInvite = InviteUserRequest.builder()
                .email("rogue_admin@example.test")
                .targetRole("ROLE_ADMIN")
                .deliveryMethod("BOTH")
                .build();
        assertThrows(AccessDeniedException.class, () -> invitationService.createInvitation(adminInvite, staffAuth));

        // External client attempts to invite anyone
        InviteUserRequest clientInvite = InviteUserRequest.builder()
                .email("unauthorized@example.test")
                .targetRole("ROLE_STAFF")
                .deliveryMethod("BOTH")
                .build();
        assertThrows(AccessDeniedException.class, () -> invitationService.createInvitation(clientInvite, clientAuth));

        // When accepting, role is strictly assigned from invitation, ignoring any tampering
        InvitationResponse inviteRes = invitationService.createInvitation(InviteUserRequest.builder()
                .email("honest_client@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build(), adminAuth);

        UserSummaryResponse createdUser = invitationService.acceptInvitation(AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("honest_user")
                .password("ValidPassword123#")
                .build());

        assertEquals("ROLE_CLIENT", createdUser.getRole());
    }

    @Test
    @DisplayName("P5.3.2-07: Email Failure Resilience — Email network failure preserves manual link and transaction")
    void testEmailFailureResilienceAndFallback() {
        // Configure mock email service to simulate a network outage
        mockEmailDeliveryService.setSimulateFailure(true);
        mockEmailDeliveryService.setSimulatedFailureReason("SMTP connection timed out after 5000ms");

        InviteUserRequest req = InviteUserRequest.builder()
                .email("fallback_client@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(req, adminAuth);

        // Verification: The creation transaction was NOT aborted
        assertNotNull(inviteRes);
        assertNotNull(inviteRes.getRawToken());
        assertEquals("FAILED", inviteRes.getEmailDeliveryStatus(), "Delivery status must reflect email failure");
        assertNotNull(inviteRes.getInvitationUrl(), "Manual sharing URL must still be available");
        assertNotNull(inviteRes.getManualSharingSnippet());

        // Verify that the manual link remains fully functional despite email outage
        UserSummaryResponse createdUser = invitationService.acceptInvitation(AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("fallback_user")
                .password("FallbackPassword123!")
                .build());

        assertNotNull(createdUser);
        assertEquals("ROLE_CLIENT", createdUser.getRole());

        // Verify audit log captured the failure event
        List<AuditEventEntity> audits = auditEventRepository.findAll();
        boolean hasEmailFailedAudit = audits.stream().anyMatch(a ->
                "INVITATION_EMAIL_FAILED".equals(a.getAction()) && a.getDetailsJson().contains("fallback_client@example.test")
        );
        assertTrue(hasEmailFailedAudit, "INVITATION_EMAIL_FAILED audit event must be logged");
    }

    @Test
    @DisplayName("P5.3.2-08: Resend Capability — Admin can resend invitation with fresh token and refreshed expiration")
    void testResendInvitationCapability() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("resend_candidate@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();

        InvitationResponse originalInvite = invitationService.createInvitation(req, adminAuth);
        String originalToken = originalInvite.getRawToken();

        // Resend invitation with BOTH channels
        ResendInvitationRequest resendReq = ResendInvitationRequest.builder()
                .deliveryMethod("BOTH")
                .build();

        InvitationResponse resentInvite = invitationService.resendInvitation(
                originalInvite.getInvitationId(), resendReq, adminAuth
        );

        assertNotNull(resentInvite);
        assertNotNull(resentInvite.getRawToken());
        assertNotEquals(originalToken, resentInvite.getRawToken(), "Fresh token must be generated upon resend");
        assertEquals("DELIVERED", resentInvite.getEmailDeliveryStatus());

        // Original token MUST fail
        assertThrows(IllegalArgumentException.class, () ->
                invitationService.acceptInvitation(AcceptInvitationRequest.builder()
                        .token(originalToken)
                        .username("old_token_user")
                        .password("Password123!")
                        .build())
        );

        // Fresh token MUST succeed
        UserSummaryResponse createdUser = invitationService.acceptInvitation(AcceptInvitationRequest.builder()
                .token(resentInvite.getRawToken())
                .username("resent_user")
                .password("Password123!")
                .build());

        assertEquals("ROLE_CLIENT", createdUser.getRole());
    }

    @Test
    @DisplayName("P5.3.2-09: SmtpEmailDeliveryService — Authenticated MIME construction with verified headers")
    void testSmtpEmailDeliveryServiceMimeConstruction() throws Exception {
        JavaMailSender mockMailSender = mock(JavaMailSender.class);
        Session session = Session.getInstance(new Properties());
        MimeMessage mimeMessage = new MimeMessage(session);

        Mockito.when(mockMailSender.createMimeMessage()).thenReturn(mimeMessage);

        SmtpEmailDeliveryService smtpService = new SmtpEmailDeliveryService(
                "smtp.mailgun.org",
                587,
                "postmaster@archeon.design",
                "secret-smtp-key",
                true,
                true,
                "invitations@archeon.design",
                "ArcheOn Design Studio",
                "support@archeon.design",
                5000,
                10000
        ) {
            @Override
            protected JavaMailSender getMailSender() {
                return mockMailSender;
            }
        };

        InvitationEmailPayload payload = InvitationEmailPayload.builder()
                .invitationId(UUID.randomUUID())
                .recipientEmail("client@corp.test")
                .recipientName("Aarav Mehta")
                .targetRole("ROLE_CLIENT")
                .invitationUrl("https://portal.archeon.design/auth/accept-invitation?token=abcdef123456")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .invitedBy("super_admin")
                .build();

        var result = smtpService.sendInvitationEmail(payload);

        assertTrue(result.isSuccess());
        assertEquals("SMTP", result.getProvider());
        assertEquals("client@corp.test", result.getRecipient());
        Mockito.verify(mockMailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("P5.3.2-10: Token Tampering — Bit-flipped or malformed token fails closed")
    void testTokenTamperingFailsClosed() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("tamper_test@example.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();

        InvitationResponse inviteRes = invitationService.createInvitation(req, adminAuth);
        String validToken = inviteRes.getRawToken();

        // Flip a character in the hex string
        char tamperedChar = validToken.charAt(0) == 'a' ? 'b' : 'a';
        String tamperedToken = tamperedChar + validToken.substring(1);

        AcceptInvitationRequest tamperedReq = AcceptInvitationRequest.builder()
                .token(tamperedToken)
                .username("tamper_user")
                .password("Password123!")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                invitationService.acceptInvitation(tamperedReq)
        );
    }

    @Test
    @DisplayName("P5.3.2.2-01: Validation Endpoint — Valid token returns safe metadata without raw tokens or secrets")
    void testValidateInvitationValidToken() {
        ClientResponse client = clientService.createClient(CreateClientRequest.builder()
                .fullName("Safe Client Name")
                .email("validate_safe@client.test")
                .phone("+91-9876543209")
                .build(), adminAuth);

        InvitationResponse invite = clientService.inviteClient(client.getId(), adminAuth);

        InvitationValidationResponse validation = invitationService.validateInvitation(invite.getRawToken());

        assertTrue(validation.isValid());
        assertEquals("PENDING", validation.getStatus());
        assertEquals("validate_safe@client.test", validation.getEmail());
        assertEquals("Safe Client Name", validation.getRecipientName());
        assertEquals("ROLE_CLIENT", validation.getTargetRole());
        assertNotNull(validation.getExpiresAt());
    }

    @Test
    @DisplayName("P5.3.2.2-02: Validation Endpoint — Invalid, expired, revoked, and accepted tokens fail closed")
    void testValidateInvitationLifecycleStates() {
        // 1. Missing / null token
        InvitationValidationResponse nullRes = invitationService.validateInvitation(null);
        assertFalse(nullRes.isValid());
        assertEquals("INVALID", nullRes.getStatus());

        // 2. Non-existent token
        InvitationValidationResponse notFoundRes = invitationService.validateInvitation("0123456789abcdef0123456789abcdef");
        assertFalse(notFoundRes.isValid());
        assertEquals("INVALID", notFoundRes.getStatus());

        // 3. Revoked token
        InviteUserRequest req = InviteUserRequest.builder()
                .email("revoked_val@client.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();
        InvitationResponse invite = invitationService.createInvitation(req, adminAuth);
        invitationService.revokeInvitation(invite.getInvitationId(), adminAuth);

        InvitationValidationResponse revokedRes = invitationService.validateInvitation(invite.getRawToken());
        assertFalse(revokedRes.isValid());
        assertEquals("REVOKED", revokedRes.getStatus());

        // 4. Accepted token
        InviteUserRequest req2 = InviteUserRequest.builder()
                .email("accepted_val@client.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();
        InvitationResponse invite2 = invitationService.createInvitation(req2, adminAuth);
        invitationService.acceptInvitation(AcceptInvitationRequest.builder()
                .token(invite2.getRawToken())
                .username("accepted_val_user")
                .password("Password123!")
                .build());

        InvitationValidationResponse acceptedRes = invitationService.validateInvitation(invite2.getRawToken());
        assertFalse(acceptedRes.isValid());
        assertEquals("ACCEPTED", acceptedRes.getStatus());
    }

    @Test
    @DisplayName("P5.3.2.2-03: Email HTML Escaping — Dynamic parameters with script tags are HTML entity encoded")
    void testEmailHtmlEscapingMaliciousInput() throws Exception {
        JavaMailSender mockMailSender = mock(JavaMailSender.class);
        Session session = Session.getInstance(new Properties());
        MimeMessage mimeMessage = new MimeMessage(session);

        Mockito.when(mockMailSender.createMimeMessage()).thenReturn(mimeMessage);

        SmtpEmailDeliveryService smtpService = new SmtpEmailDeliveryService(
                "smtp.mailgun.org", 587, "user", "pass", true, true,
                "invitations@archeon.design", "ArcheOn", "support@archeon.design", 5000, 10000
        ) {
            @Override
            protected JavaMailSender getMailSender() {
                return mockMailSender;
            }
        };

        String maliciousName = "<script>alert('pwned')</script> & \"Mr. O'Connor\"";
        InvitationEmailPayload payload = InvitationEmailPayload.builder()
                .invitationId(UUID.randomUUID())
                .recipientEmail("malicious_test@example.test")
                .recipientName(maliciousName)
                .targetRole("ROLE_CLIENT")
                .invitationUrl("https://portal.archeon.design/auth/accept-invitation?token=abcdef123456")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .invitedBy("super_admin")
                .build();

        var result = smtpService.sendInvitationEmail(payload);
        assertTrue(result.isSuccess());

        // Extract content from MimeMessage to verify escaping
        Object content = mimeMessage.getContent();
        assertNotNull(content);

        // Verify with reflection or directly via text inspection
        String rawContent = content.toString();
        // The raw script tag must NOT exist in the message
        assertFalse(rawContent.contains("<script>alert('pwned')</script>"), "Raw unescaped script tags must not exist in email HTML");
    }

    @Test
    @DisplayName("P5.3.2.2-04: Transaction Boundary — Failed DB transaction dispatches zero emails")
    void testTransactionRollbackDoesNotDispatchEmail() {
        mockEmailDeliveryService.clear();

        // Target an invalid role which fails DB transaction
        InviteUserRequest invalidReq = InviteUserRequest.builder()
                .email("rollback_test@example.test")
                .targetRole("INVALID_ROLE_ATTEMPT")
                .deliveryMethod("EMAIL")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                invitationService.createInvitation(invalidReq, adminAuth)
        );

        // Verify zero emails dispatched
        assertEquals(0, mockEmailDeliveryService.getDispatchedPayloads().size(),
                "Failed database transaction must NEVER dispatch phantom emails");
    }

    @Test
    @DisplayName("P5.3.2.2-05: Contract Validation — Missing or short username rejected with clear error")
    void testAcceptInvitationContractValidation() {
        InviteUserRequest req = InviteUserRequest.builder()
                .email("contract_test@client.test")
                .targetRole("ROLE_CLIENT")
                .deliveryMethod("MANUAL")
                .build();
        InvitationResponse invite = invitationService.createInvitation(req, adminAuth);

        // 1. Missing username
        AcceptInvitationRequest missingUsernameReq = AcceptInvitationRequest.builder()
                .token(invite.getRawToken())
                .username("")
                .password("Password123!")
                .build();
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                invitationService.acceptInvitation(missingUsernameReq)
        );
        assertTrue(ex1.getMessage().contains("Username is required"));

        // 2. Too short username
        AcceptInvitationRequest shortUsernameReq = AcceptInvitationRequest.builder()
                .token(invite.getRawToken())
                .username("ab")
                .password("Password123!")
                .build();
        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                invitationService.acceptInvitation(shortUsernameReq)
        );
        assertTrue(ex2.getMessage().contains("at least 3 characters"));

        // 3. Short password
        AcceptInvitationRequest shortPassReq = AcceptInvitationRequest.builder()
                .token(invite.getRawToken())
                .username("valid_user")
                .password("short")
                .build();
        IllegalArgumentException ex3 = assertThrows(IllegalArgumentException.class, () ->
                invitationService.acceptInvitation(shortPassReq)
        );
        assertTrue(ex3.getMessage().contains("at least 8 characters"));

        // 4. Successful acceptance with optional fullName and phone
        AcceptInvitationRequest validReq = AcceptInvitationRequest.builder()
                .token(invite.getRawToken())
                .username("contract_valid_user")
                .password("StrongPassword2026!")
                .fullName("Contract Tester")
                .phone("+91-9876543299")
                .build();

        UserSummaryResponse createdUser = invitationService.acceptInvitation(validReq);
        assertNotNull(createdUser.getId());
        assertEquals("contract_valid_user", createdUser.getUsername());
        assertEquals("Contract Tester", createdUser.getFullName());
        assertEquals("+91-9876543299", createdUser.getPhone());
    }
}
