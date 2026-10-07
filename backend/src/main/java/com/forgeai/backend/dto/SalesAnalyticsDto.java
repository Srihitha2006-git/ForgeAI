package com.forgeai.backend.dto;

import java.math.BigDecimal;

public class SalesAnalyticsDto {
    private BigDecimal totalRevenue;
    private BigDecimal deliveredRevenue;
    private long totalOrders;
    private long completedOrdersCount;
    private long nonCancelledOrdersCount;
    private long cancelledOrdersCount;
    private BigDecimal averageOrderValue;
    private String revenueCalculationRule;

    public SalesAnalyticsDto() {
    }

    public SalesAnalyticsDto(BigDecimal totalRevenue, BigDecimal deliveredRevenue, long totalOrders,
                             long completedOrdersCount, long nonCancelledOrdersCount,
                             long cancelledOrdersCount, BigDecimal averageOrderValue,
                             String revenueCalculationRule) {
        this.totalRevenue = totalRevenue;
        this.deliveredRevenue = deliveredRevenue;
        this.totalOrders = totalOrders;
        this.completedOrdersCount = completedOrdersCount;
        this.nonCancelledOrdersCount = nonCancelledOrdersCount;
        this.cancelledOrdersCount = cancelledOrdersCount;
        this.averageOrderValue = averageOrderValue;
        this.revenueCalculationRule = revenueCalculationRule;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getDeliveredRevenue() {
        return deliveredRevenue;
    }

    public void setDeliveredRevenue(BigDecimal deliveredRevenue) {
        this.deliveredRevenue = deliveredRevenue;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getCompletedOrdersCount() {
        return completedOrdersCount;
    }

    public void setCompletedOrdersCount(long completedOrdersCount) {
        this.completedOrdersCount = completedOrdersCount;
    }

    public long getNonCancelledOrdersCount() {
        return nonCancelledOrdersCount;
    }

    public void setNonCancelledOrdersCount(long nonCancelledOrdersCount) {
        this.nonCancelledOrdersCount = nonCancelledOrdersCount;
    }

    public long getCancelledOrdersCount() {
        return cancelledOrdersCount;
    }

    public void setCancelledOrdersCount(long cancelledOrdersCount) {
        this.cancelledOrdersCount = cancelledOrdersCount;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public String getRevenueCalculationRule() {
        return revenueCalculationRule;
    }

    public void setRevenueCalculationRule(String revenueCalculationRule) {
        this.revenueCalculationRule = revenueCalculationRule;
    }
}
