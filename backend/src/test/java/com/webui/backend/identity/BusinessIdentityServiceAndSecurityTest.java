package com.webui.backend.identity;

import com.webui.backend.dto.identity.ClientDto.*;
import com.webui.backend.dto.identity.InvitationDto.*;
import com.webui.backend.dto.identity.UserDto.*;
import com.webui.backend.dto.identity.VendorDto.*;
import com.webui.backend.model.*;
import com.webui.backend.repository.*;
import com.webui.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class BusinessIdentityServiceAndSecurityTest {

    @Autowired
    private ClientService clientService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserInvitationService invitationService;

    @Autowired
    private FinancialOperationsService financialOperationsService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserInvitationRepository invitationRepository;

    @Autowired
    private BillApprovalRepository billApprovalRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Authentication adminAuth;
    private Authentication staffAuth;
    private Authentication clientAAuth;
    private Authentication clientBAuth;
    private Authentication vendorAAuth;
    private Authentication vendorBAuth;

    @BeforeEach
    void setUp() {
        billApprovalRepository.findByBillId("BILL-CLIENT-UUID-01").ifPresent(billApprovalRepository::delete);
        billApprovalRepository.findByBillId("BILL-CLIENT-REF-01").ifPresent(billApprovalRepository::delete);

        invitationRepository.deleteAll();
        clientRepository.deleteAll();
        vendorRepository.deleteAll();

        List<String> testUsernames = List.of(
                "admin_super", "studio_staff", "client_a", "client_b", "vendor_a", "vendor_b",
                "client_user_1", "test_user_pw", "consortium_user", "client_onboarded_user"
        );
        for (String u : testUsernames) {
            userRepository.findByUsername(u).ifPresent(userRepository::delete);
        }

        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin_super", "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        staffAuth = new UsernamePasswordAuthenticationToken(
                "studio_staff", "password", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

        clientAAuth = new UsernamePasswordAuthenticationToken(
                "client_a", "password", List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));

        clientBAuth = new UsernamePasswordAuthenticationToken(
                "client_b", "password", List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));

        vendorAAuth = new UsernamePasswordAuthenticationToken(
                "vendor_a", "password", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));

        vendorBAuth = new UsernamePasswordAuthenticationToken(
                "vendor_b", "password", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));

        userRepository.save(UserEntity.builder().username("admin_super").password(passwordEncoder.encode("password")).role("ROLE_ADMIN").build());
        userRepository.save(UserEntity.builder().username("studio_staff").password(passwordEncoder.encode("password")).role("ROLE_STAFF").build());
    }

    @Test
    @DisplayName("Admin can create client, reference is auto-generated if omitted, audit event logged")
    void testCreateClientByAdminSuccess() {
        CreateClientRequest req = CreateClientRequest.builder()
                .fullName("Entity Client Alpha")
                .email("alpha@client-domain.test")
                .phone("+91-9820011223")
                .organization("Alpha Holdings")
                .location("City A")
                .notes("Standard client")
                .build();

        ClientResponse res = clientService.createClient(req, adminAuth);

        assertNotNull(res.getId());
        assertTrue(res.getClientReference().startsWith("CLI-"));
        assertEquals("Entity Client Alpha", res.getFullName());
        assertEquals("ACTIVE", res.getStatus());
        assertEquals("NOT_INVITED", res.getPortalAccess());

        assertTrue(auditEventRepository.findAll().stream()
                .anyMatch(a -> "CLIENT_CREATED".equals(a.getAction()) && a.getEntityId().equals(res.getId().toString())));
    }

    @Test
    @DisplayName("Non-staff cannot create clients (AccessDenied)")
    void testCreateClientByNonStaffRejected() {
        CreateClientRequest req = CreateClientRequest.builder()
                .fullName("Unauthorized Entity")
                .email("unauth@domain.test")
                .phone("+91-1234567890")
                .build();

        assertThrows(AccessDeniedException.class, () -> clientService.createClient(req, clientAAuth));
    }

    @Test
    @DisplayName("BOLA/IDOR Protection: Client A cannot view Client B profile")
    void testClientIsolationBOLA() {
        ClientResponse clientA = clientService.createClient(CreateClientRequest.builder()
                .fullName("Client A Org").email("clientA@domain.test").phone("123").build(), adminAuth);

        ClientResponse clientB = clientService.createClient(CreateClientRequest.builder()
                .fullName("Client B Org").email("clientB@domain.test").phone("456").build(), adminAuth);

        userRepository.save(UserEntity.builder()
                .username("client_a").password(passwordEncoder.encode("pass")).role("ROLE_CLIENT")
                .clientId(clientA.getId()).build());

        userRepository.save(UserEntity.builder()
                .username("client_b").password(passwordEncoder.encode("pass")).role("ROLE_CLIENT")
                .clientId(clientB.getId()).build());

        assertNotNull(clientService.getClientById(clientA.getId(), clientAAuth));
        assertThrows(AccessDeniedException.class, () -> clientService.getClientById(clientB.getId(), clientAAuth));
        assertThrows(AccessDeniedException.class, () -> clientService.getClientById(clientA.getId(), clientBAuth));
    }

    @Test
    @DisplayName("Client self-service: Can update phone and org, cannot modify status or notes")
    void testClientSelfServiceUpdate() {
        ClientResponse clientA = clientService.createClient(CreateClientRequest.builder()
                .fullName("Client A Org").email("clientA@domain.test").phone("123").notes("Internal Studio Note").build(), adminAuth);

        userRepository.save(UserEntity.builder()
                .username("client_a").password(passwordEncoder.encode("pass")).role("ROLE_CLIENT")
                .clientId(clientA.getId()).build());

        UpdateClientRequest updateReq = UpdateClientRequest.builder()
                .phone("+91-9999999999")
                .organization("Client A Expanded")
                .notes("Attempted Override")
                .build();

        ClientResponse updated = clientService.updateClient(clientA.getId(), updateReq, clientAAuth);

        assertEquals("+91-9999999999", updated.getPhone());
        assertEquals("Client A Expanded", updated.getOrganization());
        assertEquals("Internal Studio Note", updated.getNotes());
    }

    @Test
    @DisplayName("Suspending a client deactivates all linked user accounts and revokes sessions")
    void testClientSuspensionRevokesSessions() {
        ClientResponse client = clientService.createClient(CreateClientRequest.builder()
                .fullName("Suspended Organization").email("suspend@domain.test").phone("123").build(), adminAuth);

        UserEntity user = userRepository.save(UserEntity.builder()
                .username("client_user_1").password(passwordEncoder.encode("pass")).role("ROLE_CLIENT")
                .clientId(client.getId()).enabled(true).status("ACTIVE").tokenVersion(1L).build());

        clientService.updateClientStatus(client.getId(), UpdateClientStatusRequest.builder().status("SUSPENDED").build(), adminAuth);

        ClientEntity refreshedClient = clientRepository.findById(client.getId()).orElseThrow();
        assertEquals("SUSPENDED", refreshedClient.getStatus());

        UserEntity refreshedUser = userRepository.findById(user.getId()).orElseThrow();
        assertFalse(refreshedUser.isEnabled());
        assertEquals("SUSPENDED", refreshedUser.getStatus());
        assertEquals(2L, refreshedUser.getTokenVersion());
    }

    @Test
    @DisplayName("Admin can create vendor with valid category; invalid category rejected")
    void testVendorCreationAndCategoryValidation() {
        CreateVendorRequest req = CreateVendorRequest.builder()
                .businessName("Vendor Alpha Millwork")
                .contactPerson("Supervisor One")
                .email("contact@vendoralpha.test")
                .phone("+91-9811122334")
                .category("CARPENTRY")
                .build();

        VendorResponse res = vendorService.createVendor(req, adminAuth);
        assertNotNull(res.getId());
        assertEquals("CARPENTRY", res.getCategory());
        assertEquals("ACTIVE", res.getStatus());

        CreateVendorRequest invalidReq = CreateVendorRequest.builder()
                .businessName("Bad Category Vendor")
                .contactPerson("Person")
                .email("bad@vendor.test")
                .phone("123")
                .category("UNKNOWN_CATEGORY")
                .build();

        assertThrows(IllegalArgumentException.class, () -> vendorService.createVendor(invalidReq, adminAuth));
    }

    @Test
    @DisplayName("BOLA/IDOR Protection: Vendor A cannot view or mutate Vendor B profile")
    void testVendorIsolationBOLA() {
        VendorResponse vendorA = vendorService.createVendor(CreateVendorRequest.builder()
                .businessName("Vendor A Ltd").contactPerson("A").email("vendorA@domain.test").phone("123").category("ELECTRICAL").build(), adminAuth);

        VendorResponse vendorB = vendorService.createVendor(CreateVendorRequest.builder()
                .businessName("Vendor B Ltd").contactPerson("B").email("vendorB@domain.test").phone("456").category("HVAC").build(), adminAuth);

        userRepository.save(UserEntity.builder().username("vendor_a").password("p").role("ROLE_VENDOR").vendorId(vendorA.getId()).build());
        userRepository.save(UserEntity.builder().username("vendor_b").password("p").role("ROLE_VENDOR").vendorId(vendorB.getId()).build());

        assertNotNull(vendorService.getVendorById(vendorA.getId(), vendorAAuth));
        assertThrows(AccessDeniedException.class, () -> vendorService.getVendorById(vendorB.getId(), vendorAAuth));
        assertThrows(AccessDeniedException.class, () -> vendorService.updateVendor(
                vendorA.getId(), UpdateVendorRequest.builder().businessName("Hacked").build(), vendorBAuth));
    }

    @Test
    @DisplayName("Invitation-only onboarding: Invitation created, public acceptance creates active user")
    void testInvitationLifecycleSuccess() {
        ClientResponse client = clientService.createClient(CreateClientRequest.builder()
                .fullName("Invited Client Corp").email("onboarding@invited-client.test").phone("123").build(), adminAuth);

        InvitationResponse inviteRes = clientService.inviteClient(client.getId(), adminAuth);
        assertNotNull(inviteRes.getRawToken());
        assertEquals("onboarding@invited-client.test", inviteRes.getEmail());
        assertEquals("ROLE_CLIENT", inviteRes.getTargetRole());

        ClientEntity c = clientRepository.findById(client.getId()).orElseThrow();
        assertEquals("INVITATION_PENDING", c.getPortalAccess());

        AcceptInvitationRequest acceptReq = AcceptInvitationRequest.builder()
                .token(inviteRes.getRawToken())
                .username("client_onboarded_user")
                .password("StrongPassword123!")
                .fullName("Onboarded Lead")
                .phone("+91-9876543210")
                .build();

        UserSummaryResponse createdUser = invitationService.acceptInvitation(acceptReq);

        assertNotNull(createdUser.getId());
        assertEquals("client_onboarded_user", createdUser.getUsername());
        assertEquals("ROLE_CLIENT", createdUser.getRole());
        assertEquals(client.getId(), createdUser.getClientId());
        assertTrue(createdUser.isEnabled());

        c = clientRepository.findById(client.getId()).orElseThrow();
        assertEquals("ACTIVE", c.getPortalAccess());

        assertThrows(IllegalStateException.class, () -> invitationService.acceptInvitation(acceptReq));
    }

    @Test
    @DisplayName("Privileged role invitation invariant: Staff cannot invite ROLE_ADMIN or Finance Managers")
    void testPrivilegedRoleInvitationProtection() {
        InviteUserRequest adminInvite = InviteUserRequest.builder()
                .email("unauthorized_admin@domain.test")
                .targetRole("ROLE_ADMIN")
                .build();

        assertThrows(AccessDeniedException.class, () -> invitationService.createInvitation(adminInvite, staffAuth));

        InviteUserRequest financeManagerInvite = InviteUserRequest.builder()
                .email("unauthorized_finance@domain.test")
                .targetRole("ROLE_FINANCE_MANAGER")
                .build();

        assertThrows(AccessDeniedException.class, () -> invitationService.createInvitation(financeManagerInvite, staffAuth));
    }

    @Test
    @DisplayName("Security Invariant: Admin cannot modify their own role (prevents self-demotion/manipulation)")
    void testAdminCannotModifyOwnRole() {
        UserEntity adminUser = userRepository.findByUsername("admin_super").orElseThrow();

        UpdateUserRoleRequest req = UpdateUserRoleRequest.builder().role("ROLE_STAFF").build();

        assertThrows(IllegalStateException.class, () -> userService.updateUserRole(adminUser.getId(), req, adminAuth));
    }

    @Test
    @DisplayName("Security Invariant: Admin cannot deactivate their own account")
    void testAdminCannotDeactivateOwnAccount() {
        UserEntity adminUser = userRepository.findByUsername("admin_super").orElseThrow();

        UpdateUserStatusRequest req = UpdateUserStatusRequest.builder().status("SUSPENDED").enabled(false).build();

        assertThrows(IllegalStateException.class, () -> userService.updateUserStatus(adminUser.getId(), req, adminAuth));
    }

    @Test
    @DisplayName("Password change verifies old password, increments tokenVersion, and terminates active sessions")
    void testUserChangePasswordRevokesSessions() {
        UserEntity user = userRepository.save(UserEntity.builder()
                .username("test_user_pw")
                .password(passwordEncoder.encode("OldPassword123!"))
                .role("ROLE_STAFF")
                .tokenVersion(1L)
                .build());

        Authentication userAuth = new UsernamePasswordAuthenticationToken(
                "test_user_pw", "OldPassword123!", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

        assertThrows(IllegalArgumentException.class, () -> userService.changePassword(userAuth,
                ChangePasswordRequest.builder().currentPassword("WrongPassword").newPassword("NewPassword123!").build()));

        userService.changePassword(userAuth,
                ChangePasswordRequest.builder().currentPassword("OldPassword123!").newPassword("NewPassword123!").build());

        UserEntity refreshed = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(2L, refreshed.getTokenVersion());
        assertTrue(passwordEncoder.matches("NewPassword123!", refreshed.getPassword()));
    }

    @Test
    @DisplayName("Enhanced Bill Access: ClientEntity linkage enables authorized bill access by Client UUID or Reference")
    void testEnhancedBillAccessWithClientEntityLinkage() {
        ClientResponse client = clientService.createClient(CreateClientRequest.builder()
                .fullName("Consortium Client").email("consortium@domain.test").phone("123").build(), adminAuth);

        UserEntity clientUser = userRepository.save(UserEntity.builder()
                .username("consortium_user").password("pass").role("ROLE_CLIENT")
                .clientId(client.getId()).build());

        Authentication clientAuth = new UsernamePasswordAuthenticationToken(
                "consortium_user", "pass", List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));

        BillApprovalEntity billWithUuid = billApprovalRepository.save(BillApprovalEntity.builder()
                .billId("BILL-CLIENT-UUID-01")
                .amount(new BigDecimal("50000.00"))
                .currency("INR")
                .vendorId("vendor-acme")
                .clientId(client.getId().toString())
                .projectId("PROJ-01")
                .initiatorId("maker-1")
                .status("PENDING_PRIMARY")
                .createdAt(LocalDateTime.now())
                .build());

        assertDoesNotThrow(() -> financialOperationsService.validateBillAccess(billWithUuid, "consortium_user", clientAuth.getAuthorities()));

        BillApprovalEntity billWithRef = billApprovalRepository.save(BillApprovalEntity.builder()
                .billId("BILL-CLIENT-REF-01")
                .amount(new BigDecimal("50000.00"))
                .currency("INR")
                .vendorId("vendor-acme")
                .clientId(client.getClientReference())
                .projectId("PROJ-01")
                .initiatorId("maker-1")
                .status("PENDING_PRIMARY")
                .createdAt(LocalDateTime.now())
                .build());

        assertDoesNotThrow(() -> financialOperationsService.validateBillAccess(billWithRef, "consortium_user", clientAuth.getAuthorities()));

        assertThrows(AccessDeniedException.class, () ->
                financialOperationsService.validateBillAccess(billWithUuid, "client_b", clientBAuth.getAuthorities()));
    }
}
