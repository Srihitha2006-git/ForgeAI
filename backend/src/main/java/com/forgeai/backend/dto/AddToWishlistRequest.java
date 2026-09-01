package com.forgeai.backend.dto;

public class AddToWishlistRequest {
    private Long productId;

    public AddToWishlistRequest() {}

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }
}
