package com.forgeai.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.entity.Role;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_CUSTOMER_EMAIL = "testcustomer_dashboard@forgeai.com";
    private static final String TEST_CUSTOMER_PASSWORD = "CustomerPassword123!";
    private static final String TEST_ADMIN_EMAIL = "admin_dashboard@forgeai.com";
    private static final String TEST_ADMIN_PASSWORD = "Admin@ForgeAI2026!";

    private User testCustomer;
    private User testAdmin;

    @BeforeEach
    void setUp() {
        // Ensure customer user exists
        Optional<User> existingCustomer = userRepository.findByEmail(TEST_CUSTOMER_EMAIL);
        if (existingCustomer.isEmpty()) {
            testCustomer = new User(
                "Test Dashboard Customer",
                TEST_CUSTOMER_EMAIL,
                passwordEncoder.encode(TEST_CUSTOMER_PASSWORD),
                Role.CUSTOMER
            );
            testCustomer = userRepository.save(testCustomer);
        } else {
            testCustomer = existingCustomer.get();
        }

        // Ensure admin user exists
        Optional<User> existingAdmin = userRepository.findByEmail(TEST_ADMIN_EMAIL);
        if (existingAdmin.isEmpty()) {
            testAdmin = new User(
                "ForgeAI Dashboard Administrator",
                TEST_ADMIN_EMAIL,
                passwordEncoder.encode(TEST_ADMIN_PASSWORD),
                Role.ADMIN
            );
            testAdmin = userRepository.save(testAdmin);
        } else {
            testAdmin = existingAdmin.get();
        }
    }

    @Test
    @DisplayName("Admin user can successfully access admin dashboard summary API (200 OK)")
    void testAdminAccessDashboardSummary() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/dashboard/summary")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProducts", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.totalCustomers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalOrders", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.totalRevenue", notNullValue()))
                .andExpect(jsonPath("$.lowStockProducts", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.totalAvailableStock", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.orderStatusCounts", notNullValue()))
                .andExpect(jsonPath("$.lowStockItems", notNullValue()))
                .andExpect(jsonPath("$.recentActivity", notNullValue()));
    }

    @Test
    @DisplayName("Customer user is rejected with 403 Forbidden when accessing admin dashboard summary")
    void testCustomerDeniedDashboardSummary() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/dashboard/summary")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request receives 401 Unauthorized for admin dashboard summary")
    void testUnauthenticatedDashboardSummary() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Invalid or expired JWT receives 401 Unauthorized for admin dashboard summary")
    void testInvalidTokenDashboardSummary() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/summary")
                .header("Authorization", "Bearer invalid.jwt.token")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin can fetch orders breakdown (200 OK) while customer is rejected (403 Forbidden)")
    void testOrdersBreakdownAccess() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/dashboard/orders")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.placed", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.confirmed", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.delivered", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(0)));

        mockMvc.perform(get("/api/admin/dashboard/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can fetch inventory overview (200 OK) while customer is rejected (403 Forbidden)")
    void testInventoryOverviewAccess() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/dashboard/inventory")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvailableStock", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.lowStockProductsCount", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.lowStockItems", notNullValue()));

        mockMvc.perform(get("/api/admin/dashboard/inventory")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can fetch recent activities (200 OK) while customer is rejected (403 Forbidden)")
    void testRecentActivitiesAccess() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/dashboard/recent-activity")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));

        mockMvc.perform(get("/api/admin/dashboard/recent-activity")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
