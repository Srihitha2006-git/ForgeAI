package com.forgeai.backend.dto;

import java.math.BigDecimal;

public class DailySalesTrendDto {
    private String date;
    private BigDecimal revenue;
    private long orderCount;

    public DailySalesTrendDto() {
    }

    public DailySalesTrendDto(String date, BigDecimal revenue, long orderCount) {
        this.date = date;
        this.revenue = revenue;
        this.orderCount = orderCount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(long orderCount) {
        this.orderCount = orderCount;
    }
}
