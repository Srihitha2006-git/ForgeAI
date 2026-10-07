package com.forgeai.backend.dto;

public class UpdateOrderStatusRequest {
    private String status;
    private String description;

    public UpdateOrderStatusRequest() {
    }

    public UpdateOrderStatusRequest(String status, String description) {
        this.status = status;
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
