package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    @Value("${admin.secret:ForgeAIAdminSecret2026!}")
    private String expectedAdminSecret;

    @Autowired
    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    private AddressResponse convertToAddressResponse(Address address) {
        if (address == null) return null;
        return new AddressResponse(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.getAddressType(),
                address.getIsDefault()
        );
    }

    private OrderItemResponse convertToOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImageUrl(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }

    private OrderResponse convertToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(this::convertToOrderItemResponse)
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus(),
                order.getRazorpayOrderId(),
                order.getRazorpayPaymentId(),
                convertToAddressResponse(order.getDeliveryAddress()),
                order.getCreatedAt(),
                itemResponses
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id,
                                               @RequestHeader(value = "X-Admin-Secret", required = false) String adminSecret,
                                               @RequestBody Map<String, String> payload) {
        if (adminSecret == null || !adminSecret.equals(expectedAdminSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied: Invalid administrator secret key."));
        }

        String statusStr = payload.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Status is required."));
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid status value: " + statusStr));
        }

        String description = payload.get("description");
        if (description == null || description.trim().isEmpty()) {
            description = "Order status updated to " + newStatus;
        }

        try {
            Order updatedOrder = orderService.updateOrderStatus(id, newStatus, description);
            return ResponseEntity.ok(convertToOrderResponse(updatedOrder));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse(e.getMessage()));
        }
    }
}
