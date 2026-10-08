package com.forgeai.backend.exception;

public class AiTimeoutException extends RuntimeException {
    public AiTimeoutException(String message) {
        super(message);
    }

    public AiTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
