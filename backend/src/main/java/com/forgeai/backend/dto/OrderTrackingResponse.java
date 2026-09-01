package com.forgeai.backend.dto;

import com.forgeai.backend.entity.OrderStatus;
import java.util.List;

public class OrderTrackingResponse {
    private Long orderId;
    private OrderStatus currentStatus;
    private List<TrackingEventDto> tracking;

    public OrderTrackingResponse() {
    }

    public OrderTrackingResponse(Long orderId, OrderStatus currentStatus, List<TrackingEventDto> tracking) {
        this.orderId = orderId;
        this.currentStatus = currentStatus;
        this.tracking = tracking;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public OrderStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(OrderStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public List<TrackingEventDto> getTracking() {
        return tracking;
    }

    public void setTracking(List<TrackingEventDto> tracking) {
        this.tracking = tracking;
    }
}
