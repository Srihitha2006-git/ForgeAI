package com.forgeai.backend.dto;

import java.util.Map;

public class ProductAnalyticsDto {
    private long totalProducts;
    private long activeProducts;
    private long inactiveProducts;
    private long lowStockProductsCount;
    private long outOfStockProductsCount;
    private Map<String, Long> categoryBreakdown;

    public ProductAnalyticsDto() {
    }

    public ProductAnalyticsDto(long totalProducts, long activeProducts, long inactiveProducts,
                               long lowStockProductsCount, long outOfStockProductsCount,
                               Map<String, Long> categoryBreakdown) {
        this.totalProducts = totalProducts;
        this.activeProducts = activeProducts;
        this.inactiveProducts = inactiveProducts;
        this.lowStockProductsCount = lowStockProductsCount;
        this.outOfStockProductsCount = outOfStockProductsCount;
        this.categoryBreakdown = categoryBreakdown;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getActiveProducts() {
        return activeProducts;
    }

    public void setActiveProducts(long activeProducts) {
        this.activeProducts = activeProducts;
    }

    public long getInactiveProducts() {
        return inactiveProducts;
    }

    public void setInactiveProducts(long inactiveProducts) {
        this.inactiveProducts = inactiveProducts;
    }

    public long getLowStockProductsCount() {
        return lowStockProductsCount;
    }

    public void setLowStockProductsCount(long lowStockProductsCount) {
        this.lowStockProductsCount = lowStockProductsCount;
    }

    public long getOutOfStockProductsCount() {
        return outOfStockProductsCount;
    }

    public void setOutOfStockProductsCount(long outOfStockProductsCount) {
        this.outOfStockProductsCount = outOfStockProductsCount;
    }

    public Map<String, Long> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(Map<String, Long> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }
}
