package com.forgeai.backend.dto;

public class StockAdjustmentRequest {
    private Integer quantity;
    private Integer adjustment;
    private String reason;

    public StockAdjustmentRequest() {
    }

    public StockAdjustmentRequest(Integer quantity, String reason) {
        this.quantity = quantity;
        this.reason = reason;
    }

    public Integer getEffectiveQuantity() {
        if (quantity != null) {
            return quantity;
        }
        return adjustment;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getAdjustment() {
        return adjustment;
    }

    public void setAdjustment(Integer adjustment) {
        this.adjustment = adjustment;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
