package com.forgeai.backend.dto;

import java.math.BigDecimal;

public class PaymentCreateOrderResponse {
    private String razorpayOrderId;
    private String keyId;
    private Long amount; // in paise
    private String currency;

    public PaymentCreateOrderResponse() {
    }

    public PaymentCreateOrderResponse(String razorpayOrderId, String keyId, Long amount, String currency) {
        this.razorpayOrderId = razorpayOrderId;
        this.keyId = keyId;
        this.amount = amount;
        this.currency = currency;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
