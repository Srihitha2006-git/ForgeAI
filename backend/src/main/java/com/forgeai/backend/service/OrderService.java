package com.forgeai.backend.service;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final InventoryService inventoryService;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        OrderTrackingRepository orderTrackingRepository,
                        InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.orderTrackingRepository = orderTrackingRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, String description) {
        return updateOrderStatus(orderId, newStatus, description, "ADMIN");
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, String description, String changedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        validateTransition(currentStatus, newStatus);

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        // If order is cancelled, restock items back into inventory (Phase 4A integration)
        if (newStatus == OrderStatus.CANCELLED) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                        inventoryService.restockFromCancelledOrder(
                                item.getProduct(),
                                item.getQuantity(),
                                "Order cancelled: " + order.getOrderNumber()
                        );
                    }
                }
            }
        }

        String trackingDesc = description != null && !description.trim().isEmpty()
                ? description.trim()
                : "Order status updated from " + currentStatus + " to " + newStatus;

        OrderTracking tracking = new OrderTracking(
                order,
                newStatus,
                currentStatus,
                trackingDesc,
                changedBy != null ? changedBy : "ADMIN"
        );
        orderTrackingRepository.save(tracking);

        return order;
    }

    public void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == null || next == null) {
            throw new IllegalArgumentException("Order status cannot be null.");
        }
        if (current == next) {
            throw new IllegalStateException("Order is already in status " + current + ".");
        }
        if (OrderStatus.CANCELLED.equals(current)) {
            throw new IllegalStateException("Cannot change status of a CANCELLED order.");
        }
        if (OrderStatus.DELIVERED.equals(current)) {
            throw new IllegalStateException("Cannot change status of a DELIVERED order.");
        }

        switch (next) {
            case CONFIRMED:
                if (current != OrderStatus.PENDING && current != OrderStatus.PLACED) {
                    throw new IllegalStateException("Order can only transition to CONFIRMED from PENDING or PLACED.");
                }
                break;
            case PACKED:
            case PROCESSING:
                if (current != OrderStatus.CONFIRMED && current != OrderStatus.PENDING && current != OrderStatus.PLACED) {
                    throw new IllegalStateException("Order can only transition to PACKED from CONFIRMED.");
                }
                break;
            case SHIPPED:
                if (current != OrderStatus.PACKED && current != OrderStatus.PROCESSING) {
                    throw new IllegalStateException("Order can only transition to SHIPPED from PACKED.");
                }
                break;
            case OUT_FOR_DELIVERY:
                if (current != OrderStatus.SHIPPED) {
                    throw new IllegalStateException("Order can only transition to OUT_FOR_DELIVERY from SHIPPED.");
                }
                break;
            case DELIVERED:
                if (current != OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Order can only transition to DELIVERED from OUT_FOR_DELIVERY.");
                }
                break;
            case CANCELLED:
                if (current == OrderStatus.SHIPPED || current == OrderStatus.OUT_FOR_DELIVERY || current == OrderStatus.DELIVERED) {
                    throw new IllegalStateException("Cannot cancel an order that has been shipped or delivered.");
                }
                break;
            default:
                throw new IllegalArgumentException("Invalid status transition to " + next + ".");
        }
    }

    @Transactional(readOnly = true)
    public List<AdminOrderSummaryResponse> getAllOrdersForAdmin(String search, String statusFilter) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .filter(order -> {
                    // Status filter
                    if (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter.trim())) {
                        String filterUpper = statusFilter.trim().toUpperCase();
                        String orderStatusStr = order.getStatus() != null ? order.getStatus().name() : "";
                        // Handle aliases PENDING/PLACED and PACKED/PROCESSING
                        if ("PENDING".equals(filterUpper) && ("PENDING".equals(orderStatusStr) || "PLACED".equals(orderStatusStr))) {
                            // match
                        } else if ("PACKED".equals(filterUpper) && ("PACKED".equals(orderStatusStr) || "PROCESSING".equals(orderStatusStr))) {
                            // match
                        } else if (!orderStatusStr.equalsIgnoreCase(filterUpper)) {
                            return false;
                        }
                    }

                    // Search filter
                    if (search != null && !search.trim().isEmpty()) {
                        String query = search.trim().toLowerCase();
                        boolean matchesId = order.getId() != null && String.valueOf(order.getId()).contains(query);
                        boolean matchesOrderNumber = order.getOrderNumber() != null && order.getOrderNumber().toLowerCase().contains(query);
                        boolean matchesCustomerName = order.getUser() != null && order.getUser().getName() != null &&
                                order.getUser().getName().toLowerCase().contains(query);
                        boolean matchesCustomerEmail = order.getUser() != null && order.getUser().getEmail() != null &&
                                order.getUser().getEmail().toLowerCase().contains(query);

                        if (!matchesId && !matchesOrderNumber && !matchesCustomerName && !matchesCustomerEmail) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(this::convertToAdminOrderSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailsResponse getAdminOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        List<OrderTracking> trackingList = orderTrackingRepository.findByOrderOrderByCreatedAtAsc(order);
        List<TrackingEventDto> trackingDtos = trackingList.stream()
                .map(t -> new TrackingEventDto(t.getStatus(), t.getPreviousStatus(), t.getDescription(), t.getChangedBy(), t.getCreatedAt()))
                .collect(Collectors.toList());

        List<OrderItemResponse> itemResponses = order.getOrderItems() != null
                ? order.getOrderItems().stream().map(this::convertToOrderItemResponse).collect(Collectors.toList())
                : Collections.emptyList();

        AddressResponse addressResponse = convertToAddressResponse(order.getDeliveryAddress());

        String customerName = order.getUser() != null ? order.getUser().getName() : "Guest";
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : "N/A";
        String customerPhone = order.getDeliveryAddress() != null ? order.getDeliveryAddress().getPhone() : null;

        return new AdminOrderDetailsResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getUser() != null ? order.getUser().getId() : null,
                customerName,
                customerEmail,
                customerPhone,
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus(),
                "Online (Razorpay)",
                "PAID",
                order.getRazorpayOrderId(),
                order.getRazorpayPaymentId(),
                addressResponse,
                itemResponses,
                trackingDtos
        );
    }

    @Transactional(readOnly = true)
    public List<TrackingEventDto> getOrderHistory(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        List<OrderTracking> trackingList = orderTrackingRepository.findByOrderOrderByCreatedAtAsc(order);
        return trackingList.stream()
                .map(t -> new TrackingEventDto(t.getStatus(), t.getPreviousStatus(), t.getDescription(), t.getChangedBy(), t.getCreatedAt()))
                .collect(Collectors.toList());
    }

    private AdminOrderSummaryResponse convertToAdminOrderSummaryResponse(Order order) {
        String customerName = order.getUser() != null ? order.getUser().getName() : "Customer";
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : "N/A";
        int itemCount = order.getOrderItems() != null ? order.getOrderItems().size() : 0;

        return new AdminOrderSummaryResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getUser() != null ? order.getUser().getId() : null,
                customerName,
                customerEmail,
                order.getCreatedAt(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus(),
                itemCount,
                "Online (Razorpay)",
                "PAID"
        );
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
        Product p = item.getProduct();
        return new OrderItemResponse(
                item.getId(),
                p != null ? p.getId() : null,
                p != null ? p.getName() : "Product",
                p != null ? p.getImageUrl() : null,
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }
}
