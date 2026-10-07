package com.forgeai.backend.dto;

public class InventoryAnalyticsDto {
    private long totalAvailableStock;
    private long totalReservedStock;
    private long totalSoldStock;
    private long lowStockCount;
    private long outOfStockCount;

    public InventoryAnalyticsDto() {
    }

    public InventoryAnalyticsDto(long totalAvailableStock, long totalReservedStock, long totalSoldStock,
                                 long lowStockCount, long outOfStockCount) {
        this.totalAvailableStock = totalAvailableStock;
        this.totalReservedStock = totalReservedStock;
        this.totalSoldStock = totalSoldStock;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
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

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }
}
