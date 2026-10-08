package com.forgeai.backend.exception;

public class ChatRateLimitException extends RuntimeException {
    public ChatRateLimitException(String message) {
        super(message);
    }
}
