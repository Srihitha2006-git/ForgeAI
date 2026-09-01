package com.forgeai.backend.dto;

import com.forgeai.backend.entity.OrderStatus;
import java.time.LocalDateTime;

public class TrackingEventDto {
    private OrderStatus status;
    private String description;
    private LocalDateTime timestamp;

    public TrackingEventDto() {
    }

    public TrackingEventDto(OrderStatus status, String description, LocalDateTime timestamp) {
        this.status = status;
        this.description = description;
        this.timestamp = timestamp;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
