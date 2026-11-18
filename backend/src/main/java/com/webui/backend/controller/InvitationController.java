package com.webui.backend.controller;

import com.webui.backend.dto.identity.InvitationDto.*;
import com.webui.backend.dto.identity.UserDto.UserSummaryResponse;
import com.webui.backend.service.UserInvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    @Autowired
    private UserInvitationService invitationService;

    @PostMapping("/accept")
    public ResponseEntity<?> acceptInvitation(@RequestBody AcceptInvitationRequest req) {
        try {
            UserSummaryResponse user = invitationService.acceptInvitation(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Account successfully created and activated. You can now log in.",
                    "user", user
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createInvitation(@RequestBody InviteUserRequest req, Authentication auth) {
        try {
            InvitationResponse response = invitationService.createInvitation(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listPendingInvitations(Authentication auth) {
        try {
            List<InvitationResponse> list = invitationService.listPendingInvitations(auth);
            return ResponseEntity.ok(list);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<?> revokeInvitation(@PathVariable UUID id, Authentication auth) {
        try {
            invitationService.revokeInvitation(id, auth);
            return ResponseEntity.ok(Map.of("message", "Invitation revoked successfully"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
