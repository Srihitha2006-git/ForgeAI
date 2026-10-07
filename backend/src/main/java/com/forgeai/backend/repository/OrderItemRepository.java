package com.forgeai.backend.repository;

import com.forgeai.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    boolean existsByProductId(Long productId);

    @Query("SELECT oi.product.id, oi.product.name, oi.product.category, oi.product.imageUrl, " +
           "COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(oi.subtotal), 0) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status <> com.forgeai.backend.entity.OrderStatus.CANCELLED " +
           "GROUP BY oi.product.id, oi.product.name, oi.product.category, oi.product.imageUrl " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts();
}
