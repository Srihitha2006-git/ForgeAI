package com.forgeai.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminAnalyticsSummaryResponse {
    // Summary Cards
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long totalProducts;
    private long totalCustomers;
    private long pendingOrders;
    private long deliveredOrders;

    // Detailed Sections
    private SalesAnalyticsDto sales;
    private OrderStatusAnalyticsDto orderStatus;
    private ProductAnalyticsDto products;
    private InventoryAnalyticsDto inventory;
    private CustomerAnalyticsDto customers;
    private List<DailySalesTrendDto> dailySalesTrend;
    private List<TopProductDto> topProducts;

    public AdminAnalyticsSummaryResponse() {
    }

    public AdminAnalyticsSummaryResponse(long totalOrders, BigDecimal totalRevenue, long totalProducts,
                                         long totalCustomers, long pendingOrders, long deliveredOrders,
                                         SalesAnalyticsDto sales, OrderStatusAnalyticsDto orderStatus,
                                         ProductAnalyticsDto products, InventoryAnalyticsDto inventory,
                                         CustomerAnalyticsDto customers, List<DailySalesTrendDto> dailySalesTrend,
                                         List<TopProductDto> topProducts) {
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.totalProducts = totalProducts;
        this.totalCustomers = totalCustomers;
        this.pendingOrders = pendingOrders;
        this.deliveredOrders = deliveredOrders;
        this.sales = sales;
        this.orderStatus = orderStatus;
        this.products = products;
        this.inventory = inventory;
        this.customers = customers;
        this.dailySalesTrend = dailySalesTrend;
        this.topProducts = topProducts;
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

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public SalesAnalyticsDto getSales() {
        return sales;
    }

    public void setSales(SalesAnalyticsDto sales) {
        this.sales = sales;
    }

    public OrderStatusAnalyticsDto getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatusAnalyticsDto orderStatus) {
        this.orderStatus = orderStatus;
    }

    public ProductAnalyticsDto getProducts() {
        return products;
    }

    public void setProducts(ProductAnalyticsDto products) {
        this.products = products;
    }

    public InventoryAnalyticsDto getInventory() {
        return inventory;
    }

    public void setInventory(InventoryAnalyticsDto inventory) {
        this.inventory = inventory;
    }

    public CustomerAnalyticsDto getCustomers() {
        return customers;
    }

    public void setCustomers(CustomerAnalyticsDto customers) {
        this.customers = customers;
    }

    public List<DailySalesTrendDto> getDailySalesTrend() {
        return dailySalesTrend;
    }

    public void setDailySalesTrend(List<DailySalesTrendDto> dailySalesTrend) {
        this.dailySalesTrend = dailySalesTrend;
    }

    public List<TopProductDto> getTopProducts() {
        return topProducts;
    }

    public void setTopProducts(List<TopProductDto> topProducts) {
        this.topProducts = topProducts;
    }
}
