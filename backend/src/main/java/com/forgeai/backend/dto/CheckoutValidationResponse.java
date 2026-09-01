package com.forgeai.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutValidationResponse {
    private AddressResponse address;
    private List<CheckoutItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal shipping;
    private BigDecimal total;

    public CheckoutValidationResponse() {
    }

    public CheckoutValidationResponse(AddressResponse address, List<CheckoutItemResponse> items, BigDecimal subtotal, BigDecimal shipping, BigDecimal total) {
        this.address = address;
        this.items = items;
        this.subtotal = subtotal;
        this.shipping = shipping;
        this.total = total;
    }

    public AddressResponse getAddress() {
        return address;
    }

    public void setAddress(AddressResponse address) {
        this.address = address;
    }

    public List<CheckoutItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItemResponse> items) {
        this.items = items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShipping() {
        return shipping;
    }

    public void setShipping(BigDecimal shipping) {
        this.shipping = shipping;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
