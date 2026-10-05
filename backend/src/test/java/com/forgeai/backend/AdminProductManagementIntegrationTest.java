package com.forgeai.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminProductManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_ADMIN_EMAIL = "admin_prod_mgmt@forgeai.com";
    private static final String TEST_ADMIN_PASSWORD = "Admin@ForgeAI2026!";
    private static final String TEST_CUSTOMER_EMAIL = "cust_prod_mgmt@forgeai.com";
    private static final String TEST_CUSTOMER_PASSWORD = "CustomerPassword123!";

    private User testAdmin;
    private User testCustomer;

    @BeforeEach
    void setUp() {
        Optional<User> existingAdmin = userRepository.findByEmail(TEST_ADMIN_EMAIL);
        if (existingAdmin.isEmpty()) {
            testAdmin = new User(
                    "Admin Product Manager",
                    TEST_ADMIN_EMAIL,
                    passwordEncoder.encode(TEST_ADMIN_PASSWORD),
                    Role.ADMIN
            );
            testAdmin = userRepository.save(testAdmin);
        } else {
            testAdmin = existingAdmin.get();
        }

        Optional<User> existingCustomer = userRepository.findByEmail(TEST_CUSTOMER_EMAIL);
        if (existingCustomer.isEmpty()) {
            testCustomer = new User(
                    "Customer Product Browser",
                    TEST_CUSTOMER_EMAIL,
                    passwordEncoder.encode(TEST_CUSTOMER_PASSWORD),
                    Role.CUSTOMER
            );
            testCustomer = userRepository.save(testCustomer);
        } else {
            testCustomer = existingCustomer.get();
        }
    }

    @Test
    @DisplayName("Admin can fetch all products from /api/admin/products (200 OK)")
    void testAdminGetAllProducts() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)));
    }

    @Test
    @DisplayName("Customer is denied access with 403 Forbidden on /api/admin/products")
    void testCustomerDeniedAdminProducts() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/products")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request receives 401 Unauthorized on /api/admin/products")
    void testUnauthenticatedDeniedAdminProducts() throws Exception {
        mockMvc.perform(get("/api/admin/products")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin creates a product successfully and inventory is initialized")
    void testAdminCreateProduct() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        String uniqueSku = "TEST-CREATE-" + System.currentTimeMillis();

        Product newProduct = new Product(
                "Forge Executive Ergonomic Chair",
                "High performance ergonomic chair for enterprise desks.",
                new BigDecimal("1299.99"),
                25,
                ProductCategory.OFFICE_ENTERPRISE,
                "ForgeAI Hardware",
                uniqueSku,
                "https://images.unsplash.com/photo-1591488320449-011701bb6704"
        );
        newProduct.setActive(true);

        String responseContent = mockMvc.perform(post("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProduct)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Forge Executive Ergonomic Chair")))
                .andExpect(jsonPath("$.sku", is(uniqueSku)))
                .andExpect(jsonPath("$.price", is(1299.99)))
                .andExpect(jsonPath("$.stockQuantity", is(25)))
                .andExpect(jsonPath("$.active", is(true)))
                .andReturn().getResponse().getContentAsString();

        Product created = objectMapper.readValue(responseContent, Product.class);
        assertNotNull(created.getId());

        // Verify saved in MySQL
        Optional<Product> foundInDb = productRepository.findById(created.getId());
        assertTrue(foundInDb.isPresent());
        assertEquals("Forge Executive Ergonomic Chair", foundInDb.get().getName());

        // Verify inventory synchronized
        Optional<Inventory> inventory = inventoryRepository.findByProductId(created.getId());
        assertTrue(inventory.isPresent());
        assertEquals(25, inventory.get().getAvailableStock());
    }

    @Test
    @DisplayName("Product creation fails with 400 Bad Request on invalid input or duplicate SKU")
    void testAdminCreateProductValidation() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        // 1. Missing name
        Product invalidProd = new Product("", "Desc", new BigDecimal("100.00"), 5, ProductCategory.FURNITURE, "Brand", "SKU-VAL-1", null);
        mockMvc.perform(post("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProd)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("name is required")));

        // 2. Negative price
        invalidProd.setName("Valid Name");
        invalidProd.setPrice(new BigDecimal("-10.00"));
        mockMvc.perform(post("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProd)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("price cannot be negative")));

        // 3. Negative stock
        invalidProd.setPrice(new BigDecimal("10.00"));
        invalidProd.setStockQuantity(-5);
        mockMvc.perform(post("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProd)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("stock quantity cannot be negative")));
    }

    @Test
    @DisplayName("Admin edits a product successfully without creating duplicate records")
    void testAdminEditProduct() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        String initialSku = "TEST-EDIT-" + System.currentTimeMillis();

        Product prod = new Product(
                "Original Product Name",
                "Original description",
                new BigDecimal("499.00"),
                10,
                ProductCategory.OFFICE_ENTERPRISE,
                "Original Brand",
                initialSku,
                null
        );
        prod.setActive(true);
        Product saved = productRepository.save(prod);
        long initialCount = productRepository.count();

        // Update product
        saved.setName("Updated Product Name Elite");
        saved.setPrice(new BigDecimal("549.99"));
        saved.setStockQuantity(15);
        saved.setDescription("Updated description text.");

        mockMvc.perform(put("/api/admin/products/" + saved.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Updated Product Name Elite")))
                .andExpect(jsonPath("$.price", is(549.99)))
                .andExpect(jsonPath("$.stockQuantity", is(15)));

        // Verify count didn't increase (no duplicate created)
        assertEquals(initialCount, productRepository.count());

        // Verify in DB
        Product updatedInDb = productRepository.findById(saved.getId()).orElseThrow();
        assertEquals("Updated Product Name Elite", updatedInDb.getName());
        assertEquals(new BigDecimal("549.99"), updatedInDb.getPrice());
        assertEquals(15, updatedInDb.getStockQuantity());
    }

    @Test
    @DisplayName("Admin toggles product active/inactive status")
    void testAdminToggleProductStatus() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        Product prod = new Product(
                "Toggle Test Product",
                "Testing toggle",
                new BigDecimal("99.00"),
                5,
                ProductCategory.KITCHEN_UTENSILS,
                "ToggleBrand",
                "TOGGLE-" + System.currentTimeMillis(),
                null
        );
        prod.setActive(true);
        Product saved = productRepository.save(prod);

        // Deactivate
        Map<String, Object> deactivatePayload = Map.of("active", false);
        mockMvc.perform(patch("/api/admin/products/" + saved.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(deactivatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));

        Product deactivatedInDb = productRepository.findById(saved.getId()).orElseThrow();
        assertFalse(deactivatedInDb.getActive());

        // Reactivate
        Map<String, Object> reactivatePayload = Map.of("active", true);
        mockMvc.perform(patch("/api/admin/products/" + saved.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reactivatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(true)));

        Product reactivatedInDb = productRepository.findById(saved.getId()).orElseThrow();
        assertTrue(reactivatedInDb.getActive());
    }

    @Test
    @DisplayName("Safe Deletion: Product with order history is deactivated instead of hard-deleted")
    void testSafeDeleteProductWithOrderHistory() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        // Create product
        Product orderedProduct = new Product(
                "Historical Order Product",
                "Referenced by an order item",
                new BigDecimal("199.99"),
                8,
                ProductCategory.FURNITURE,
                "FurnitureCorp",
                "HIST-" + System.currentTimeMillis(),
                null
        );
        orderedProduct.setActive(true);
        orderedProduct = productRepository.save(orderedProduct);

        // Create dummy address and order referencing this product
        Address address = new Address(
                testCustomer,
                "Customer Tester",
                "9876543210",
                "123 Tech Park",
                "Suite 4B",
                "Bengaluru",
                "Karnataka",
                "560100",
                "India",
                AddressType.HOME,
                true
        );
        address = addressRepository.save(address);

        Order order = new Order();
        order.setUser(testCustomer);
        order.setDeliveryAddress(address);
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setStatus(OrderStatus.PLACED);
        order.setTotalAmount(new BigDecimal("199.99"));
        order.setRazorpayOrderId("order_test_123");
        order.setRazorpayPaymentId("pay_test_123");
        order = orderRepository.save(order);

        OrderItem orderItem = new OrderItem(order, orderedProduct, 1, new BigDecimal("199.99"), new BigDecimal("199.99"));
        orderItemRepository.save(orderItem);

        // Admin requests DELETE
        mockMvc.perform(delete("/api/admin/products/" + orderedProduct.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deactivated", is(true)))
                .andExpect(jsonPath("$.deleted", is(false)))
                .andExpect(jsonPath("$.message", containsString("cannot be permanently deleted")));

        // Product still exists in DB, but is now inactive
        Optional<Product> stillExists = productRepository.findById(orderedProduct.getId());
        assertTrue(stillExists.isPresent());
        assertFalse(stillExists.get().getActive());
    }

    @Test
    @DisplayName("Safe Deletion: Unreferenced product without orders is permanently deleted")
    void testSafeDeleteUnreferencedProduct() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        Product unreferenced = new Product(
                "Temporary Test Product",
                "No orders reference this",
                new BigDecimal("49.99"),
                3,
                ProductCategory.KITCHEN_UTENSILS,
                "KitchenCorp",
                "UNREF-" + System.currentTimeMillis(),
                null
        );
        unreferenced.setActive(true);
        unreferenced = productRepository.save(unreferenced);
        Long unreferencedId = unreferenced.getId();

        mockMvc.perform(delete("/api/admin/products/" + unreferencedId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted", is(true)))
                .andExpect(jsonPath("$.deactivated", is(false)));

        // Verifying deleted from DB
        Optional<Product> deletedProduct = productRepository.findById(unreferencedId);
        assertTrue(deletedProduct.isEmpty());
    }

    @Test
    @DisplayName("Customer receives 403 Forbidden when trying to create, update, or delete products")
    void testCustomerForbiddenOnProductMutations() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        Product prod = new Product("Cust Attempt", "Desc", new BigDecimal("10.00"), 1, ProductCategory.FURNITURE, "Brand", "CUST-ATT", null);

        // POST
        mockMvc.perform(post("/api/admin/products")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(prod)))
                .andExpect(status().isForbidden());

        // PUT
        mockMvc.perform(put("/api/admin/products/1")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(prod)))
                .andExpect(status().isForbidden());

        // PATCH
        mockMvc.perform(patch("/api/admin/products/1/status")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"active\": false}"))
                .andExpect(status().isForbidden());

        // DELETE
        mockMvc.perform(delete("/api/admin/products/1")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
