package com.forgeai.backend.dto;

public class LowStockItemDto {
    private Long productId;
    private String productName;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer availableStock;
    private Integer reservedStock;
    private Integer lowStockThreshold;
    private String status;

    public LowStockItemDto() {
    }

    public LowStockItemDto(Long productId, String productName, String sku, String category,
                           String imageUrl, Integer availableStock, Integer reservedStock,
                           Integer lowStockThreshold, String status) {
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.category = category;
        this.imageUrl = imageUrl;
        this.availableStock = availableStock;
        this.reservedStock = reservedStock;
        this.lowStockThreshold = lowStockThreshold;
        this.status = status;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(Integer availableStock) {
        this.availableStock = availableStock;
    }

    public Integer getReservedStock() {
        return reservedStock;
    }

    public void setReservedStock(Integer reservedStock) {
        this.reservedStock = reservedStock;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
