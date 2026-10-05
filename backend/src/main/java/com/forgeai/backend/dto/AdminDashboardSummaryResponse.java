package com.forgeai.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminDashboardSummaryResponse {
    private long totalProducts;
    private long activeProducts;
    private long inactiveProducts;
    private long totalCustomers;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long lowStockProducts;
    private long totalAvailableStock;
    private long totalReservedStock;
    private long totalSoldStock;
    private OrderStatusCountsResponse orderStatusCounts;
    private List<LowStockItemDto> lowStockItems;
    private List<RecentActivityDto> recentActivity;

    public AdminDashboardSummaryResponse() {
    }

    public AdminDashboardSummaryResponse(long totalProducts, long activeProducts, long inactiveProducts,
                                         long totalCustomers, long totalOrders, BigDecimal totalRevenue,
                                         long lowStockProducts, long totalAvailableStock, long totalReservedStock,
                                         long totalSoldStock, OrderStatusCountsResponse orderStatusCounts,
                                         List<LowStockItemDto> lowStockItems, List<RecentActivityDto> recentActivity) {
        this.totalProducts = totalProducts;
        this.activeProducts = activeProducts;
        this.inactiveProducts = inactiveProducts;
        this.totalCustomers = totalCustomers;
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.lowStockProducts = lowStockProducts;
        this.totalAvailableStock = totalAvailableStock;
        this.totalReservedStock = totalReservedStock;
        this.totalSoldStock = totalSoldStock;
        this.orderStatusCounts = orderStatusCounts;
        this.lowStockItems = lowStockItems;
        this.recentActivity = recentActivity;
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

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(long lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
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

    public OrderStatusCountsResponse getOrderStatusCounts() {
        return orderStatusCounts;
    }

    public void setOrderStatusCounts(OrderStatusCountsResponse orderStatusCounts) {
        this.orderStatusCounts = orderStatusCounts;
    }

    public List<LowStockItemDto> getLowStockItems() {
        return lowStockItems;
    }

    public void setLowStockItems(List<LowStockItemDto> lowStockItems) {
        this.lowStockItems = lowStockItems;
    }

    public List<RecentActivityDto> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<RecentActivityDto> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
