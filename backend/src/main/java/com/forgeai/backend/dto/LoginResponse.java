package com.forgeai.backend.dto;

public class LoginResponse {
    private Long id;
    private String name;
    private String email;
    private String message;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(Long id, String name, String email, String message, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.message = message;
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
