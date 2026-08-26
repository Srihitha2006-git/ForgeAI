package com.forgeai.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> checkHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Backend is running smoothly.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health/db")
    public ResponseEntity<Map<String, String>> checkDbHealth() {
        Map<String, String> response = new HashMap<>();
        try {
            // Perform a simple native query check
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                response.put("status", "UP");
                response.put("database", "MySQL");
                response.put("message", "Database connection established successfully.");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "DOWN");
                response.put("message", "Unexpected query result from database.");
                return ResponseEntity.status(500).body(response);
            }
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("message", "Database connection failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
