package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.service.AdminAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    @Autowired
    public AdminAnalyticsController(AdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminAnalyticsSummaryResponse> getAnalyticsSummary() {
        return ResponseEntity.ok(analyticsService.getAnalyticsSummary());
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesAnalyticsDto> getSalesAnalytics() {
        return ResponseEntity.ok(analyticsService.getSalesAnalytics());
    }

    @GetMapping("/orders")
    public ResponseEntity<OrderStatusAnalyticsDto> getOrderStatusAnalytics() {
        return ResponseEntity.ok(analyticsService.getOrderStatusAnalytics());
    }

    @GetMapping("/products")
    public ResponseEntity<ProductAnalyticsDto> getProductAnalytics() {
        return ResponseEntity.ok(analyticsService.getProductAnalytics());
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryAnalyticsDto> getInventoryAnalytics() {
        return ResponseEntity.ok(analyticsService.getInventoryAnalytics());
    }

    @GetMapping("/customers")
    public ResponseEntity<CustomerAnalyticsDto> getCustomerAnalytics() {
        return ResponseEntity.ok(analyticsService.getCustomerAnalytics());
    }

    @GetMapping("/sales-trend")
    public ResponseEntity<List<DailySalesTrendDto>> getDailySalesTrend() {
        return ResponseEntity.ok(analyticsService.getDailySalesTrend());
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDto>> getTopSellingProducts() {
        return ResponseEntity.ok(analyticsService.getTopSellingProducts());
    }
}
