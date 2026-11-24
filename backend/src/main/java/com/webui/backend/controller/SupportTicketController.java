package com.webui.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webui.backend.model.SupportTicketEntity;
import com.webui.backend.repository.SupportTicketRepository;
import com.webui.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Help & Support Tickets", description = "Ticket submission, status updates, and threaded responses")
@SecurityRequirement(name = "bearerAuth")
public class SupportTicketController {

    private final SupportTicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get support tickets for authenticated user or all tickets for admin")
    public ResponseEntity<List<Map<String, Object>>> getTickets(
            @RequestParam(required = false) String userRole,
            Authentication auth
    ) {
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_STAFF") || a.equals("ROLE_FINANCE_MANAGER"));

        List<SupportTicketEntity> list;
        if (isAdmin) {
            if (userRole != null && !userRole.isBlank()) {
                list = ticketRepository.findByUserRoleOrderByCreatedAtDesc(userRole.toUpperCase());
            } else {
                list = ticketRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            list = ticketRepository.findByUsernameOrderByCreatedAtDesc(username);
        }

        List<Map<String, Object>> response = list.stream().map(this::toMap).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new support ticket")
    public ResponseEntity<?> createTicket(@RequestBody CreateTicketRequest req, Authentication auth) {
        String username = auth.getName();
        if (req.subject() == null || req.subject().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Subject is mandatory"));
        }
        if (req.description() == null || req.description().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Description is mandatory"));
        }

        String userRole = "STAFF";
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if (ga.getAuthority().equals("ROLE_CLIENT")) userRole = "CLIENT";
            else if (ga.getAuthority().equals("ROLE_VENDOR")) userRole = "VENDOR";
        }

        String refCode = "TKT-2026-" + (1000 + new Random().nextInt(9000));
        LocalDateTime now = LocalDateTime.now();

        List<Map<String, Object>> initialMessages = new ArrayList<>();
        Map<String, Object> firstMsg = new HashMap<>();
        firstMsg.put("id", UUID.randomUUID().toString());
        firstMsg.put("message", req.description().trim());
        firstMsg.put("senderLabel", username);
        firstMsg.put("sentAt", now.toString());
        firstMsg.put("isVendorMessage", "VENDOR".equalsIgnoreCase(userRole));
        firstMsg.put("isStaff", "STAFF".equalsIgnoreCase(userRole));
        initialMessages.add(firstMsg);

        String messagesJson = "[]";
        try {
            messagesJson = objectMapper.writeValueAsString(initialMessages);
        } catch (Exception e) {
            log.error("Error serializing messages", e);
        }

        SupportTicketEntity ticket = SupportTicketEntity.builder()
                .ticketReference(refCode)
                .username(username)
                .userRole(userRole)
                .subject(req.subject().trim())
                .category(req.category() != null ? req.category() : "Other")
                .priority(req.priority() != null ? req.priority() : "Normal")
                .status("Open")
                .relatedReference(req.relatedReference())
                .assignedTeam("Studio Operations")
                .description(req.description().trim())
                .messagesJson(messagesJson)
                .createdAt(now)
                .updatedAt(now)
                .build();

        SupportTicketEntity saved = ticketRepository.save(ticket);

        // Notify admin about new ticket
        try {
            notificationService.sendNotification(
                    "admin",
                    "New Support Ticket: " + saved.getTicketReference(),
                    "[" + userRole + "] " + username + " opened a ticket: " + saved.getSubject(),
                    "SUPPORT",
                    "/admin/support"
            );
        } catch (Exception ignored) {}

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(saved));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get single ticket details")
    public ResponseEntity<?> getTicketById(@PathVariable UUID id, Authentication auth) {
        Optional<SupportTicketEntity> opt = ticketRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Ticket not found"));
        }
        SupportTicketEntity t = opt.get();
        return ResponseEntity.ok(toMap(t));
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Reply to a support ticket")
    public ResponseEntity<?> replyTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        String message = body.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
        }

        Optional<SupportTicketEntity> opt = ticketRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Ticket not found"));
        }

        SupportTicketEntity t = opt.get();
        String username = auth.getName();
        boolean isStaff = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_STAFF") || a.equals("ROLE_FINANCE_MANAGER"));

        List<Map<String, Object>> messages = parseMessages(t.getMessagesJson());
        Map<String, Object> reply = new HashMap<>();
        reply.put("id", UUID.randomUUID().toString());
        reply.put("message", message.trim());
        reply.put("senderLabel", isStaff ? "Studio Support Lead" : username);
        reply.put("sentAt", LocalDateTime.now().toString());
        reply.put("isVendorMessage", "VENDOR".equalsIgnoreCase(t.getUserRole()) && !isStaff);
        reply.put("isStaff", isStaff);
        messages.add(reply);

        try {
            t.setMessagesJson(objectMapper.writeValueAsString(messages));
        } catch (Exception e) {
            log.error("Failed to serialize replies", e);
        }

        t.setUpdatedAt(LocalDateTime.now());
        if (isStaff) {
            t.setStatus("Awaiting Vendor Response");
        } else {
            t.setStatus("In Progress");
        }

        SupportTicketEntity saved = ticketRepository.save(t);

        // Notify other party
        try {
            if (isStaff) {
                notificationService.sendNotification(
                        t.getUsername(),
                        "Update on Ticket " + t.getTicketReference(),
                        "Studio response: " + message.trim(),
                        "SUPPORT",
                        t.getUserRole().equalsIgnoreCase("VENDOR") ? "/vendor/support" : "/client/support"
                );
            } else {
                notificationService.sendNotification(
                        "admin",
                        "Reply on Ticket " + t.getTicketReference(),
                        username + ": " + message.trim(),
                        "SUPPORT",
                        "/admin/support"
                );
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok(toMap(saved));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update support ticket status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        Optional<SupportTicketEntity> opt = ticketRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Ticket not found"));
        }

        SupportTicketEntity t = opt.get();
        t.setStatus(status.trim());
        t.setUpdatedAt(LocalDateTime.now());
        SupportTicketEntity saved = ticketRepository.save(t);

        return ResponseEntity.ok(toMap(saved));
    }

    private List<Map<String, Object>> parseMessages(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private Map<String, Object> toMap(SupportTicketEntity t) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId().toString());
        map.put("referenceCode", t.getTicketReference());
        map.put("subject", t.getSubject());
        map.put("category", t.getCategory());
        map.put("priority", t.getPriority());
        map.put("status", t.getStatus());
        map.put("description", t.getDescription());
        map.put("username", t.getUsername());
        map.put("userRole", t.getUserRole());
        map.put("relatedReference", t.getRelatedReference());
        map.put("assignedTeam", t.getAssignedTeam());
        map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
        map.put("updatedAt", t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : "");
        map.put("messages", parseMessages(t.getMessagesJson()));
        return map;
    }

    public record CreateTicketRequest(
            String subject,
            String category,
            String priority,
            String relatedReference,
            String description
    ) {}
}
