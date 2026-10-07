package com.forgeai.backend.dto;

import java.math.BigDecimal;

public class TopProductDto {
    private int rank;
    private Long productId;
    private String productName;
    private String category;
    private String imageUrl;
    private long quantitySold;
    private BigDecimal revenue;

    public TopProductDto() {
    }

    public TopProductDto(int rank, Long productId, String productName, String category,
                         String imageUrl, long quantitySold, BigDecimal revenue) {
        this.rank = rank;
        this.productId = productId;
        this.productName = productName;
        this.category = category;
        this.imageUrl = imageUrl;
        this.quantitySold = quantitySold;
        this.revenue = revenue;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
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

    public long getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(long quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}
