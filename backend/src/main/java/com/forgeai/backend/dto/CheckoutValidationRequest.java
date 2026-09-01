package com.forgeai.backend.dto;

public class CheckoutValidationRequest {
    private Long addressId;

    public CheckoutValidationRequest() {
    }

    public CheckoutValidationRequest(Long addressId) {
        this.addressId = addressId;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }
}
