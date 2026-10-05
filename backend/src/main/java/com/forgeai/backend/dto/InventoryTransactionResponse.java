package com.forgeai.backend.dto;

import com.forgeai.backend.entity.InventoryTransactionType;
import java.time.LocalDateTime;

public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private InventoryTransactionType transactionType;
    private Integer quantity;
    private Integer previousAvailableStock;
    private Integer newAvailableStock;
    private String reason;
    private LocalDateTime createdAt;

    public InventoryTransactionResponse() {
    }

    public InventoryTransactionResponse(Long id, Long productId, String productName,
                                        InventoryTransactionType transactionType, Integer quantity,
                                        Integer previousAvailableStock, Integer newAvailableStock,
                                        String reason, LocalDateTime createdAt) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousAvailableStock = previousAvailableStock;
        this.newAvailableStock = newAvailableStock;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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
