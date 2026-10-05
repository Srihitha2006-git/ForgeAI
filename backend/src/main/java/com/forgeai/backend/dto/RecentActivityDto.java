package com.forgeai.backend.dto;

import java.time.LocalDateTime;

public class RecentActivityDto {
    private String id;
    private String type; // ORDER, INVENTORY, CUSTOMER, PRODUCT
    private String title;
    private String description;
    private LocalDateTime timestamp;
    private String badgeType; // SUCCESS, WARNING, INFO, PRIMARY

    public RecentActivityDto() {
    }

    public RecentActivityDto(String id, String type, String title, String description, LocalDateTime timestamp, String badgeType) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.timestamp = timestamp;
        this.badgeType = badgeType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getBadgeType() {
        return badgeType;
    }

    public void setBadgeType(String badgeType) {
        this.badgeType = badgeType;
    }
}
