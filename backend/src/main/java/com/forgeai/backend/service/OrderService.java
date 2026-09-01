package com.forgeai.backend.service;

import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository, OrderTrackingRepository orderTrackingRepository) {
        this.orderRepository = orderRepository;
        this.orderTrackingRepository = orderTrackingRepository;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, String description) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        validateTransition(order.getStatus(), newStatus);

        order.setStatus(newStatus);
        orderRepository.save(order);

        OrderTracking tracking = new OrderTracking(order, newStatus, description);
        orderTrackingRepository.save(tracking);

        return order;
    }

    public void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return; // No-op
        }
        if (OrderStatus.CANCELLED.equals(current)) {
            throw new IllegalStateException("Cannot change status of a CANCELLED order.");
        }
        if (OrderStatus.DELIVERED.equals(current)) {
            throw new IllegalStateException("Cannot change status of a DELIVERED order.");
        }

        switch (next) {
            case CONFIRMED:
                if (current != OrderStatus.PLACED) {
                    throw new IllegalStateException("Order can only transition to CONFIRMED from PLACED.");
                }
                break;
            case PROCESSING:
                if (current != OrderStatus.CONFIRMED && current != OrderStatus.PLACED) {
                    throw new IllegalStateException("Order can only transition to PROCESSING from PLACED or CONFIRMED.");
                }
                break;
            case SHIPPED:
                if (current != OrderStatus.PROCESSING) {
                    throw new IllegalStateException("Order can only transition to SHIPPED from PROCESSING.");
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
                throw new IllegalArgumentException("Invalid status transition.");
        }
    }
}
