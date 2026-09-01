package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Order;
import com.forgeai.backend.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    List<OrderTracking> findByOrderOrderByCreatedAtAsc(Order order);
}
