package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Inventory;
import com.forgeai.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProduct(Product product);
    Optional<Inventory> findByProductId(Long productId);

    @Query("SELECT COALESCE(SUM(i.availableStock), 0) FROM Inventory i")
    Long sumAvailableStock();

    @Query("SELECT COALESCE(SUM(i.reservedStock), 0) FROM Inventory i")
    Long sumReservedStock();

    @Query("SELECT COALESCE(SUM(i.soldStock), 0) FROM Inventory i")
    Long sumSoldStock();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableStock <= i.lowStockThreshold")
    Long countLowStock();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableStock = 0")
    Long countOutOfStock();

    @Query("SELECT i FROM Inventory i WHERE i.availableStock <= i.lowStockThreshold ORDER BY i.availableStock ASC")
    List<Inventory> findLowStockInventories();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM Inventory i WHERE i.product.id = :productId")
    void deleteByProductId(@org.springframework.data.repository.query.Param("productId") Long productId);
}
