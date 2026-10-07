package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.OrderStatus;
import com.forgeai.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    @Autowired
    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<AdminOrderSummaryResponse>> getAllOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<AdminOrderSummaryResponse> orders = orderService.getAllOrdersForAdmin(search, status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long id) {
        try {
            AdminOrderDetailsResponse response = orderService.getAdminOrderDetails(id);
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while retrieving order details: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatusPatch(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        return processStatusUpdate(id, request);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatusPut(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        return processStatusUpdate(id, request);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getOrderHistory(@PathVariable Long id) {
        try {
            List<TrackingEventDto> history = orderService.getOrderHistory(id);
            return ResponseEntity.ok(history);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while retrieving order history: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> processStatusUpdate(Long id, UpdateOrderStatusRequest request) {
        if (request == null || request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Order status is required."));
        }

        OrderStatus targetStatus;
        try {
            targetStatus = OrderStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid order status: " + request.getStatus() +
                    ". Supported statuses are: PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED"));
        }

        String adminEmail = "ADMIN";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().isEmpty()) {
            adminEmail = auth.getName();
        }

        try {
            orderService.updateOrderStatus(id, targetStatus, request.getDescription(), adminEmail);
            AdminOrderDetailsResponse updatedDetails = orderService.getAdminOrderDetails(id);
            return ResponseEntity.ok(updatedDetails);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while updating order status: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }
}
