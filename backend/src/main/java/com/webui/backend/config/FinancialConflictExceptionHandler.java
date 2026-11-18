package com.webui.backend.config;

import jakarta.persistence.OptimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class FinancialConflictExceptionHandler {

    @ExceptionHandler({
            ObjectOptimisticLockingFailureException.class,
            OptimisticLockException.class
    })
    public ResponseEntity<Map<String, Object>> handleOptimisticLockingFailure(Exception ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "The record was modified concurrently by another transaction. Please reload and try again.",
                "status", HttpStatus.CONFLICT.value(),
                "conflictType", "OPTIMISTIC_LOCK_FAILURE",
                "timestamp", LocalDateTime.now()
        ));
    }
}
