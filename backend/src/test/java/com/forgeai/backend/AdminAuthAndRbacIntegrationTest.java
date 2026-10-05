package com.forgeai.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.dto.LoginRequest;
import com.forgeai.backend.dto.StockAdjustmentRequest;
import com.forgeai.backend.entity.Product;
import com.forgeai.backend.entity.Role;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.repository.ProductRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminAuthAndRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_CUSTOMER_EMAIL = "testcustomer_rbac@forgeai.com";
    private static final String TEST_CUSTOMER_PASSWORD = "CustomerPassword123!";
    private static final String TEST_ADMIN_EMAIL = "admin@forgeai.com";
    private static final String TEST_ADMIN_PASSWORD = "Admin@ForgeAI2026!";

    private User testCustomer;
    private User testAdmin;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        // Ensure customer user exists
        Optional<User> existingCustomer = userRepository.findByEmail(TEST_CUSTOMER_EMAIL);
        if (existingCustomer.isEmpty()) {
            testCustomer = new User(
                "Test RBAC Customer",
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
                "ForgeAI Administrator",
                TEST_ADMIN_EMAIL,
                passwordEncoder.encode(TEST_ADMIN_PASSWORD),
                Role.ADMIN
            );
            testAdmin = userRepository.save(testAdmin);
        } else {
            testAdmin = existingAdmin.get();
        }

        // Fetch a product for inventory tests
        testProduct = productRepository.findAll().stream().findFirst().orElse(null);
    }

    @Test
    @DisplayName("Scenario 1: Existing customer login still works and returns CUSTOMER role")
    void scenario1_customerLoginWorks() throws Exception {
        LoginRequest loginRequest = new LoginRequest(TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_PASSWORD);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(TEST_CUSTOMER_EMAIL))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("Scenario 2: New public registration receives CUSTOMER role by default")
    void scenario2_publicRegistrationAssignsCustomerRole() throws Exception {
        String uniqueEmail = "newuser_" + System.currentTimeMillis() + "@test.com";
        Map<String, String> regRequest = Map.of(
            "name", "New Public User",
            "email", uniqueEmail,
            "password", "SecurePassword123!"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        Optional<User> saved = userRepository.findByEmail(uniqueEmail);
        assertThat(saved).isPresent();
        assertThat(saved.get().getRole()).isEqualTo(Role.CUSTOMER);
    }

    @Test
    @DisplayName("Scenario 3: Public registration cannot create an ADMIN account")
    void scenario3_publicRegistrationCannotCreateAdmin() throws Exception {
        String uniqueEmail = "fakeadmin_" + System.currentTimeMillis() + "@test.com";
        Map<String, String> attackPayload = new HashMap<>();
        attackPayload.put("name", "Malicious Actor");
        attackPayload.put("email", uniqueEmail);
        attackPayload.put("password", "HackerPass123!");
        attackPayload.put("role", "ADMIN");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attackPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));

        Optional<User> saved = userRepository.findByEmail(uniqueEmail);
        assertThat(saved).isPresent();
        assertThat(saved.get().getRole()).isEqualTo(Role.CUSTOMER);
    }

    @Test
    @DisplayName("Scenario 4: An admin can log in using the existing login flow")
    void scenario4_adminLoginWorks() throws Exception {
        LoginRequest adminLogin = new LoginRequest(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(TEST_ADMIN_EMAIL))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Scenario 5: A valid admin token can access admin-protected endpoint GET /api/admin/me")
    void scenario5_adminTokenAccessesAdminMe() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/me")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testAdmin.getId()))
                .andExpect(jsonPath("$.email").value(testAdmin.getEmail()))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Scenario 6: A customer token receives 403 Forbidden when accessing admin endpoints")
    void scenario6_customerTokenForbiddenOnAdminEndpoints() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/me")
                .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(containsString("Forbidden")));
    }

    @Test
    @DisplayName("Scenario 7: An unauthenticated request receives 401 Unauthorized for protected endpoints")
    void scenario7_unauthenticatedRequestsGet401() throws Exception {
        mockMvc.perform(get("/api/admin/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Unauthorized")));

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Unauthorized")));
    }

    @Test
    @DisplayName("Scenario 8: Customer shopping functionality remains accessible for customers")
    void scenario8_customerShoppingAccessible() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/cart")
                .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/wishlist")
                .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Scenario 9: Inventory read endpoints preserve their intended public access")
    void scenario9_inventoryReadEndpointsPreserveAccess() throws Exception {
        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk());

        if (testProduct != null) {
            mockMvc.perform(get("/api/inventory/" + testProduct.getId()))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Scenario 10: Inventory mutation endpoints reject customer access with 403 Forbidden")
    void scenario10_inventoryMutationRejectsCustomer() throws Exception {
        if (testProduct != null) {
            String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

            StockAdjustmentRequest adjustReq = new StockAdjustmentRequest();
            adjustReq.setQuantity(5);
            adjustReq.setReason("Customer attempt");

            mockMvc.perform(post("/api/inventory/" + testProduct.getId() + "/adjust")
                    .header("Authorization", "Bearer " + customerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(adjustReq)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Scenario 11: Inventory mutation works for authorized ADMIN")
    void scenario11_inventoryMutationWorksForAdmin() throws Exception {
        if (testProduct != null) {
            String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

            StockAdjustmentRequest adjustReq = new StockAdjustmentRequest();
            adjustReq.setQuantity(2);
            adjustReq.setReason("Admin restock verification");

            mockMvc.perform(post("/api/inventory/" + testProduct.getId() + "/adjust")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(adjustReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productId").value(testProduct.getId()));
        }
    }

    @Test
    @DisplayName("Scenario 12: Invalid or expired JWTs are rejected with 401 Unauthorized")
    void scenario12_invalidJwtRejected() throws Exception {
        mockMvc.perform(get("/api/admin/me")
                .header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Unauthorized")));

        mockMvc.perform(get("/api/cart")
                .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.invalid.signature"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Unauthorized")));
    }

    @Test
    @DisplayName("Scenario 13: Existing database records have valid role and remain intact")
    void scenario13_existingRecordsRemainIntact() {
        Iterable<User> users = userRepository.findAll();
        assertThat(users).isNotEmpty();
        for (User u : users) {
            assertThat(u.getRole()).isNotNull();
            assertThat(u.getEmail()).isNotEmpty();
        }
    }
}
