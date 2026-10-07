package com.forgeai.backend.dto;

import java.util.Map;

public class OrderStatusAnalyticsDto {
    private long pending;
    private long placed;
    private long confirmed;
    private long packed;
    private long processing;
    private long shipped;
    private long outForDelivery;
    private long delivered;
    private long cancelled;
    private long total;
    private Map<String, Long> statusBreakdown;

    public OrderStatusAnalyticsDto() {
    }

    public OrderStatusAnalyticsDto(long pending, long placed, long confirmed, long packed,
                                   long processing, long shipped, long outForDelivery,
                                   long delivered, long cancelled, long total,
                                   Map<String, Long> statusBreakdown) {
        this.pending = pending;
        this.placed = placed;
        this.confirmed = confirmed;
        this.packed = packed;
        this.processing = processing;
        this.shipped = shipped;
        this.outForDelivery = outForDelivery;
        this.delivered = delivered;
        this.cancelled = cancelled;
        this.total = total;
        this.statusBreakdown = statusBreakdown;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public long getPlaced() {
        return placed;
    }

    public void setPlaced(long placed) {
        this.placed = placed;
    }

    public long getConfirmed() {
        return confirmed;
    }

    public void setConfirmed(long confirmed) {
        this.confirmed = confirmed;
    }

    public long getPacked() {
        return packed;
    }

    public void setPacked(long packed) {
        this.packed = packed;
    }

    public long getProcessing() {
        return processing;
    }

    public void setProcessing(long processing) {
        this.processing = processing;
    }

    public long getShipped() {
        return shipped;
    }

    public void setShipped(long shipped) {
        this.shipped = shipped;
    }

    public long getOutForDelivery() {
        return outForDelivery;
    }

    public void setOutForDelivery(long outForDelivery) {
        this.outForDelivery = outForDelivery;
    }

    public long getDelivered() {
        return delivered;
    }

    public void setDelivered(long delivered) {
        this.delivered = delivered;
    }

    public long getCancelled() {
        return cancelled;
    }

    public void setCancelled(long cancelled) {
        this.cancelled = cancelled;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public Map<String, Long> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(Map<String, Long> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }
}
