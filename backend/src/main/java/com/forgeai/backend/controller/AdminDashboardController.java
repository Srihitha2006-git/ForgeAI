package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @Autowired
    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminDashboardSummaryResponse> getSummary() {
        AdminDashboardSummaryResponse summary = adminDashboardService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/orders")
    public ResponseEntity<OrderStatusCountsResponse> getOrdersOverview() {
        OrderStatusCountsResponse counts = adminDashboardService.getOrderStatusCounts();
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventorySummaryResponse> getInventoryOverview() {
        InventorySummaryResponse inventory = adminDashboardService.getInventoryOverview();
        return ResponseEntity.ok(inventory);
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<List<RecentActivityDto>> getRecentActivity() {
        List<RecentActivityDto> activity = adminDashboardService.getRecentActivities();
        return ResponseEntity.ok(activity);
    }
}
