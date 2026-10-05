package com.forgeai.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private InventoryTransactionType transactionType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "previous_available_stock", nullable = false)
    private Integer previousAvailableStock;

    @Column(name = "new_available_stock", nullable = false)
    private Integer newAvailableStock;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = true, updatable = false)
    private LocalDateTime createdAt;

    public InventoryTransaction() {
    }

    public InventoryTransaction(Product product, InventoryTransactionType transactionType, Integer quantity,
                                Integer previousAvailableStock, Integer newAvailableStock, String reason) {
        this.product = product;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousAvailableStock = previousAvailableStock;
        this.newAvailableStock = newAvailableStock;
        this.reason = reason;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public InventoryTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(InventoryTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getPreviousAvailableStock() {
        return previousAvailableStock;
    }

    public void setPreviousAvailableStock(Integer previousAvailableStock) {
        this.previousAvailableStock = previousAvailableStock;
    }

    public Integer getNewAvailableStock() {
        return newAvailableStock;
    }

    public void setNewAvailableStock(Integer newAvailableStock) {
        this.newAvailableStock = newAvailableStock;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
