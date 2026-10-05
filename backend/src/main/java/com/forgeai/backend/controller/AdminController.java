package com.forgeai.backend.controller;

import com.forgeai.backend.entity.Role;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    @Autowired
    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getAdminProfile(HttpServletRequest request) {
        Object userIdObj = request.getAttribute("authenticatedUserId");
        if (userIdObj == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Unauthorized: User not authenticated.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        Long userId = (Long) userIdObj;
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "User not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }

        User user = optionalUser.get();
        if (user.getRole() != Role.ADMIN) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Forbidden: Access denied.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        }

        Map<String, Object> adminData = new HashMap<>();
        adminData.put("id", user.getId());
        adminData.put("name", user.getName());
        adminData.put("email", user.getEmail());
        adminData.put("role", user.getRole().name());

        return ResponseEntity.ok(adminData);
    }
}
