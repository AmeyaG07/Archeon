package com.webui.backend.security;

public class TokenRevocationUnavailableException extends RuntimeException {

    public TokenRevocationUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public TokenRevocationUnavailableException(String message) {
        super(message);
    }
}
