package com.forgeai.backend.controller;

import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.dto.LoginRequest;
import com.forgeai.backend.dto.LoginResponse;
import com.forgeai.backend.dto.RegisterRequest;
import com.forgeai.backend.dto.RegisterResponse;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        // Validate fields are provided
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Name is required."));
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Email is required."));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Password is required."));
        }

        // Basic validation format for email
        if (!request.getEmail().contains("@")) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid email format."));
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Email is already in use."));
        }

        // Hash the password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Save User - Always assign CUSTOMER role during public registration
        User user = new User(
            request.getName().trim(),
            request.getEmail().trim(),
            hashedPassword,
            com.forgeai.backend.entity.Role.CUSTOMER
        );
        User savedUser = userRepository.save(user);

        // Generate JWT Token with CUSTOMER role
        String token = JwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        // Return response without password but with token and role
        RegisterResponse response = new RegisterResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            "User registered successfully.",
            token,
            savedUser.getRole().name()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        // Validate fields are provided
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Email is required."));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Password is required."));
        }

        // Find user by email
        java.util.Optional<User> optionalUser = userRepository.findByEmail(request.getEmail().trim());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid email or password."));
        }

        User user = optionalUser.get();

        // Verify password using passwordEncoder
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid email or password."));
        }

        com.forgeai.backend.entity.Role userRole = user.getRole() != null ? user.getRole() : com.forgeai.backend.entity.Role.CUSTOMER;

        // Generate JWT Token with user's actual role
        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), userRole.name());

        // Return safe response with token and role
        LoginResponse response = new LoginResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            "Login successful.",
            token,
            userRole.name()
        );

        return ResponseEntity.ok(response);
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }
}
