package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true OR p.active IS NULL")
    long countByActiveTrue();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = false")
    long countByActiveFalse();

    List<Product> findTop10ByOrderByIdDesc();

    @Query("SELECT p.category, COUNT(p) FROM Product p WHERE p.category IS NOT NULL GROUP BY p.category")
    List<Object[]> countProductsByCategory();

    java.util.Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);
}
