package com.forgeai.backend.dto;

public class OrderStatusCountsResponse {
    private long placed;
    private long confirmed;
    private long processing;
    private long shipped;
    private long outForDelivery;
    private long delivered;
    private long cancelled;
    private long total;

    public OrderStatusCountsResponse() {
    }

    public OrderStatusCountsResponse(long placed, long confirmed, long processing,
                                     long shipped, long outForDelivery, long delivered,
                                     long cancelled, long total) {
        this.placed = placed;
        this.confirmed = confirmed;
        this.processing = processing;
        this.shipped = shipped;
        this.outForDelivery = outForDelivery;
        this.delivered = delivered;
        this.cancelled = cancelled;
        this.total = total;
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
}
