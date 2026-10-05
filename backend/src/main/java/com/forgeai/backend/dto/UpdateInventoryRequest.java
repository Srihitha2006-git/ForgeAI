package com.forgeai.backend.dto;

public class UpdateInventoryRequest {
    private Integer lowStockThreshold;
    private Integer availableStock;

    public UpdateInventoryRequest() {
    }

    public UpdateInventoryRequest(Integer lowStockThreshold, Integer availableStock) {
        this.lowStockThreshold = lowStockThreshold;
        this.availableStock = availableStock;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(Integer availableStock) {
        this.availableStock = availableStock;
    }
}
