package com.webui.backend.controller;

import com.webui.backend.dto.identity.ClientDto.*;
import com.webui.backend.dto.identity.InvitationDto.InvitationResponse;
import com.webui.backend.service.ClientService;
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
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @PostMapping
    public ResponseEntity<?> createClient(@RequestBody CreateClientRequest req, Authentication auth) {
        try {
            ClientResponse response = clientService.createClient(req, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listClients(Authentication auth) {
        try {
            List<ClientResponse> clients = clientService.listClients(auth);
            return ResponseEntity.ok(clients);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentClient(Authentication auth) {
        try {
            ClientResponse client = clientService.getCurrentClientProfile(auth);
            return ResponseEntity.ok(client);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable UUID id, Authentication auth) {
        try {
            ClientResponse client = clientService.getClientById(id, auth);
            return ResponseEntity.ok(client);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ref/{reference}")
    public ResponseEntity<?> getClientByReference(@PathVariable String reference, Authentication auth) {
        try {
            ClientResponse client = clientService.getClientByReference(reference, auth);
            return ResponseEntity.ok(client);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(
            @PathVariable UUID id,
            @RequestBody UpdateClientRequest req,
            Authentication auth) {
        try {
            ClientResponse updated = clientService.updateClient(id, req, auth);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "The client record was modified concurrently by another transaction. Please reload and try again.",
                    "status", 409
            ));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateClientStatus(
            @PathVariable UUID id,
            @RequestBody UpdateClientStatusRequest req,
            Authentication auth) {
        try {
            ClientResponse updated = clientService.updateClientStatus(id, req, auth);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | jakarta.persistence.OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "The client record was modified concurrently by another transaction. Please reload and try again.",
                    "status", 409
            ));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteClient(@PathVariable UUID id, Authentication auth) {
        try {
            InvitationResponse invitation = clientService.inviteClient(id, auth);
            return ResponseEntity.ok(invitation);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable UUID id, Authentication auth) {
        try {
            clientService.deleteClient(id, auth);
            return ResponseEntity.ok(Map.of("success", true, "message", "Client deleted successfully"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/portal-account")
    public ResponseEntity<?> createPortalAccount(
            @PathVariable UUID id,
            @RequestBody CreatePortalAccountRequest req,
            Authentication auth) {
        try {
            Map<String, Object> res = clientService.createPortalAccount(id, req, auth);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
