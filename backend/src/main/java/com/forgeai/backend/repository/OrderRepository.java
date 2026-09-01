package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Order;
import com.forgeai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    Optional<Order> findByRazorpayPaymentId(String paymentId);
    Optional<Order> findByRazorpayOrderId(String orderId);
}
