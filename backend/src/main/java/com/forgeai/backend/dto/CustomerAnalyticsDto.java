package com.forgeai.backend.dto;

public class CustomerAnalyticsDto {
    private long totalUsers;
    private long totalCustomers;
    private long totalAdmins;

    public CustomerAnalyticsDto() {
    }

    public CustomerAnalyticsDto(long totalUsers, long totalCustomers, long totalAdmins) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalAdmins = totalAdmins;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }
}
