package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;

    @Autowired
    public OrderController(UserRepository userRepository, OrderRepository orderRepository, OrderTrackingRepository orderTrackingRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderTrackingRepository = orderTrackingRepository;
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("authenticatedUserId");
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
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

    @GetMapping
    public ResponseEntity<?> getMyOrders(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(optionalUser.get());
        List<OrderResponse> responseList = orders.stream()
                .map(this::convertToOrderResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Order not found."));
        }

        Order order = optionalOrder.get();

        // Security check: Verify user ownership
        if (!order.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied: You do not own this order."));
        }

        return ResponseEntity.ok(convertToOrderResponse(order));
    }

    @GetMapping("/{orderId}/tracking")
    public ResponseEntity<?> getOrderTracking(@PathVariable Long orderId, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Order not found."));
        }

        Order order = optionalOrder.get();

        // Security check: Verify user ownership
        if (!order.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied: You do not own this order."));
        }

        List<OrderTracking> trackingEvents = orderTrackingRepository.findByOrderOrderByCreatedAtAsc(order);
        if (trackingEvents.isEmpty()) {
            OrderTracking t1 = new OrderTracking(order, OrderStatus.PLACED, "Order placed successfully.");
            OrderTracking t2 = new OrderTracking(order, OrderStatus.CONFIRMED, "Payment successfully verified.");
            OrderTracking t3 = new OrderTracking(order, OrderStatus.PROCESSING, "Your order is being prepared.");
            orderTrackingRepository.saveAll(List.of(t1, t2, t3));

            if (order.getStatus() == OrderStatus.PLACED) {
                order.setStatus(OrderStatus.PROCESSING);
                orderRepository.save(order);
            }
            trackingEvents = List.of(t1, t2, t3);
        }

        List<TrackingEventDto> eventDtos = trackingEvents.stream()
                .map(t -> new TrackingEventDto(t.getStatus(), t.getDescription(), t.getCreatedAt()))
                .collect(Collectors.toList());

        OrderTrackingResponse trackingResponse = new OrderTrackingResponse(order.getId(), order.getStatus(), eventDtos);
        return ResponseEntity.ok(trackingResponse);
    }
}
