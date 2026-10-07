package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Order;
import com.forgeai.backend.entity.OrderStatus;
import com.forgeai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    Optional<Order> findByRazorpayPaymentId(String paymentId);
    Optional<Order> findByRazorpayOrderId(String orderId);

    long countByStatus(OrderStatus status);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> com.forgeai.backend.entity.OrderStatus.CANCELLED")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = com.forgeai.backend.entity.OrderStatus.DELIVERED")
    BigDecimal calculateDeliveredRevenue();

    List<Order> findTop10ByOrderByCreatedAtDesc();

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByOrderByCreatedAtAsc();

    long countByStatusNot(OrderStatus status);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    Optional<Order> findByOrderNumber(String orderNumber);
}
