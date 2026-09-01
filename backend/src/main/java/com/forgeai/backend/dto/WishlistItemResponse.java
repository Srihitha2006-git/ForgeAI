package com.forgeai.backend.dto;

import com.forgeai.backend.entity.Product;

public class WishlistItemResponse {
    private Long id;
    private Product product;

    public WishlistItemResponse() {}

    public WishlistItemResponse(Long id, Product product) {
        this.id = id;
        this.product = product;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }
}
