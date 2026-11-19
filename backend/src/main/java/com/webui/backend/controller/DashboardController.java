package com.webui.backend.controller;

import com.webui.backend.dto.dashboard.DashboardDto;
import com.webui.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboards")
@RequiredArgsConstructor
@Tag(name = "Dashboards", description = "Role-scoped aggregate dashboard metrics for Admin, Client, and Vendor")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'STAFF')")
    @Operation(summary = "Get aggregated studio admin dashboard metrics, aging receivables, and activity stream")
    public ResponseEntity<DashboardDto.AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get client portal dashboard metrics, active projects, and outstanding bills")
    public ResponseEntity<DashboardDto.ClientDashboardResponse> getClientDashboard(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getClientDashboard(auth));
    }

    @GetMapping("/vendor")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get vendor portal dashboard metrics, invoice status breakdown, and vouchers")
    public ResponseEntity<DashboardDto.VendorDashboardResponse> getVendorDashboard(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getVendorDashboard(auth));
    }
}
