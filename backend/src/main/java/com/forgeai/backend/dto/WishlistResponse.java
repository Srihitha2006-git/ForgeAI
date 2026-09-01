package com.forgeai.backend.dto;

import java.util.List;

public class WishlistResponse {
    private Long id;
    private List<WishlistItemResponse> items;

    public WishlistResponse() {}

    public WishlistResponse(Long id, List<WishlistItemResponse> items) {
        this.id = id;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<WishlistItemResponse> getItems() {
        return items;
    }

    public void setItems(List<WishlistItemResponse> items) {
        this.items = items;
    }
}
