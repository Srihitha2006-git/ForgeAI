package com.forgeai.backend.dto;

import java.util.List;

public class InventorySummaryResponse {
    private long totalAvailableStock;
    private long totalReservedStock;
    private long totalSoldStock;
    private long lowStockProductsCount;
    private List<LowStockItemDto> lowStockItems;

    public InventorySummaryResponse() {
    }

    public InventorySummaryResponse(long totalAvailableStock, long totalReservedStock,
                                    long totalSoldStock, long lowStockProductsCount,
                                    List<LowStockItemDto> lowStockItems) {
        this.totalAvailableStock = totalAvailableStock;
        this.totalReservedStock = totalReservedStock;
        this.totalSoldStock = totalSoldStock;
        this.lowStockProductsCount = lowStockProductsCount;
        this.lowStockItems = lowStockItems;
    }

    public long getTotalAvailableStock() {
        return totalAvailableStock;
    }

    public void setTotalAvailableStock(long totalAvailableStock) {
        this.totalAvailableStock = totalAvailableStock;
    }

    public long getTotalReservedStock() {
        return totalReservedStock;
    }

    public void setTotalReservedStock(long totalReservedStock) {
        this.totalReservedStock = totalReservedStock;
    }

    public long getTotalSoldStock() {
        return totalSoldStock;
    }

    public void setTotalSoldStock(long totalSoldStock) {
        this.totalSoldStock = totalSoldStock;
    }

    public long getLowStockProductsCount() {
        return lowStockProductsCount;
    }

    public void setLowStockProductsCount(long lowStockProductsCount) {
        this.lowStockProductsCount = lowStockProductsCount;
    }

    public List<LowStockItemDto> getLowStockItems() {
        return lowStockItems;
    }

    public void setLowStockItems(List<LowStockItemDto> lowStockItems) {
        this.lowStockItems = lowStockItems;
    }
}
