package com.forgeai.backend.dto;

import com.forgeai.backend.entity.OrderStatus;
import java.time.LocalDateTime;

public class TrackingEventDto {
    private OrderStatus status;
    private OrderStatus previousStatus;
    private String description;
    private String changedBy;
    private LocalDateTime timestamp;

    public TrackingEventDto() {
    }

    public TrackingEventDto(OrderStatus status, String description, LocalDateTime timestamp) {
        this.status = status;
        this.description = description;
        this.timestamp = timestamp;
    }

    public TrackingEventDto(OrderStatus status, OrderStatus previousStatus, String description, String changedBy, LocalDateTime timestamp) {
        this.status = status;
        this.previousStatus = previousStatus;
        this.description = description;
        this.changedBy = changedBy;
        this.timestamp = timestamp;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(OrderStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
