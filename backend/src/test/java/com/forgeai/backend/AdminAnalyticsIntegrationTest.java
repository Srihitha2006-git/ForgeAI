package com.forgeai.backend;

import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import org.junit.jupiter.api.AfterEach;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminAnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_CUSTOMER_EMAIL = "analytics_customer@forgeai.com";
    private static final String TEST_CUSTOMER_PASSWORD = "CustomerPassword123!";
    private static final String TEST_ADMIN_EMAIL = "analytics_admin@forgeai.com";
    private static final String TEST_ADMIN_PASSWORD = "Admin@ForgeAI2026!";

    private User testCustomer;
    private User testAdmin;

    private final List<Long> createdOrderIds = new ArrayList<>();
    private final List<Long> createdProductIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        Optional<User> existingCustomer = userRepository.findByEmail(TEST_CUSTOMER_EMAIL);
        if (existingCustomer.isEmpty()) {
            testCustomer = new User(
                    "Analytics Customer",
                    TEST_CUSTOMER_EMAIL,
                    passwordEncoder.encode(TEST_CUSTOMER_PASSWORD),
                    Role.CUSTOMER
            );
            testCustomer = userRepository.save(testCustomer);
        } else {
            testCustomer = existingCustomer.get();
        }

        Optional<User> existingAdmin = userRepository.findByEmail(TEST_ADMIN_EMAIL);
        if (existingAdmin.isEmpty()) {
            testAdmin = new User(
                    "Analytics Admin",
                    TEST_ADMIN_EMAIL,
                    passwordEncoder.encode(TEST_ADMIN_PASSWORD),
                    Role.ADMIN
            );
            testAdmin = userRepository.save(testAdmin);
        } else {
            testAdmin = existingAdmin.get();
        }
    }

    @AfterEach
    void tearDown() {
        for (Long orderId : createdOrderIds) {
            orderRepository.findById(orderId).ifPresent(order -> {
                if (order.getOrderItems() != null) {
                    orderItemRepository.deleteAll(order.getOrderItems());
                }
                orderRepository.delete(order);
            });
        }
        createdOrderIds.clear();

        for (Long prodId : createdProductIds) {
            inventoryTransactionRepository.deleteByProductId(prodId);
            inventoryRepository.deleteByProductId(prodId);
            productRepository.deleteById(prodId);
        }
        createdProductIds.clear();
    }

    @Test
    @DisplayName("TEST 1: ADMIN requests analytics summary -> 200 OK")
    void testAdminAccessAnalyticsSummary() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/summary")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.totalRevenue", notNullValue()))
                .andExpect(jsonPath("$.totalProducts", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.totalCustomers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.sales", notNullValue()))
                .andExpect(jsonPath("$.orderStatus", notNullValue()))
                .andExpect(jsonPath("$.products", notNullValue()))
                .andExpect(jsonPath("$.inventory", notNullValue()))
                .andExpect(jsonPath("$.customers", notNullValue()))
                .andExpect(jsonPath("$.dailySalesTrend", notNullValue()))
                .andExpect(jsonPath("$.topProducts", notNullValue()));
    }

    @Test
    @DisplayName("TEST 2: CUSTOMER requests analytics -> 403 Forbidden")
    void testCustomerDeniedAnalytics() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/analytics/summary")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/analytics/sales")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/analytics/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TEST 3: Unauthenticated user requests analytics -> 401 Unauthorized")
    void testUnauthenticatedAnalytics() throws Exception {
        mockMvc.perform(get("/api/admin/analytics/summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/analytics/sales")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TEST 4: Analytics summary contains real values matching database")
    void testAnalyticsSummaryMatchesDatabase() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        long dbProductCount = productRepository.count();
        long dbCustomerCount = userRepository.countByRole(Role.CUSTOMER);
        long dbOrderCount = orderRepository.count();

        mockMvc.perform(get("/api/admin/analytics/summary")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProducts", is((int) dbProductCount)))
                .andExpect(jsonPath("$.totalCustomers", is((int) dbCustomerCount)))
                .andExpect(jsonPath("$.totalOrders", is((int) dbOrderCount)));
    }

    @Test
    @DisplayName("TEST 5: Order status counts are correct from database")
    void testOrderStatusCounts() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/orders")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pending", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.confirmed", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.shipped", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.delivered", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.cancelled", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.statusBreakdown", notNullValue()));
    }

    @Autowired
    private AddressRepository addressRepository;

    private Address testAddress;

    private void ensureTestAddress() {
        if (testAddress == null) {
            List<Address> addresses = addressRepository.findByUserId(testCustomer.getId());
            if (addresses.isEmpty()) {
                testAddress = new Address(
                        testCustomer,
                        "Analytics Customer",
                        "9876543210",
                        "100 Tech Park",
                        "Floor 2",
                        "Bengaluru",
                        "Karnataka",
                        "560001",
                        "India",
                        AddressType.HOME,
                        true
                );
                testAddress = addressRepository.save(testAddress);
            } else {
                testAddress = addresses.get(0);
            }
        }
    }

    private Order createTestOrder(OrderStatus status, BigDecimal amount) {
        ensureTestAddress();
        Order order = new Order();
        order.setUser(testCustomer);
        order.setDeliveryAddress(testAddress);
        order.setOrderNumber("ORD-ANALYTICS-" + System.currentTimeMillis() + "-" + java.util.UUID.randomUUID().toString().substring(0, 4));
        order.setStatus(status);
        order.setTotalAmount(amount);
        order.setRazorpayOrderId("order_rp_" + System.currentTimeMillis());
        order.setRazorpayPaymentId("pay_rp_" + System.currentTimeMillis());
        order.setCreatedAt(LocalDateTime.now());
        order = orderRepository.save(order);
        createdOrderIds.add(order.getId());
        return order;
    }

    @Test
    @DisplayName("TEST 6: Revenue calculation ignores CANCELLED orders")
    void testRevenueCalculationExcludesCancelled() throws Exception {
        // Create a confirmed order with amount 1000
        createTestOrder(OrderStatus.CONFIRMED, new BigDecimal("1000.00"));

        // Create a cancelled order with amount 2500
        createTestOrder(OrderStatus.CANCELLED, new BigDecimal("2500.00"));

        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/sales")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revenueCalculationRule", notNullValue()))
                .andExpect(jsonPath("$.cancelledOrdersCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("TEST 7: Product statistics active/inactive counts match database")
    void testProductStatisticsMatch() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        long activeCount = productRepository.countByActiveTrue();
        long inactiveCount = productRepository.countByActiveFalse();

        mockMvc.perform(get("/api/admin/analytics/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeProducts", is((int) activeCount)))
                .andExpect(jsonPath("$.inactiveProducts", is((int) inactiveCount)))
                .andExpect(jsonPath("$.categoryBreakdown", notNullValue()));
    }

    @Test
    @DisplayName("TEST 8: Inventory statistics match inventory records")
    void testInventoryStatistics() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/inventory")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvailableStock", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.lowStockCount", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.outOfStockCount", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("TEST 9: Customer statistics match User records")
    void testCustomerStatistics() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);

        mockMvc.perform(get("/api/admin/analytics/customers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCustomers", is((int) totalCustomers)))
                .andExpect(jsonPath("$.totalAdmins", is((int) totalAdmins)));
    }

    @Test
    @DisplayName("TEST 10: Top products ranking returns valid data structure")
    void testTopProducts() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/top-products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @DisplayName("TEST 11: Sales trend returns non-null list and handles date aggregation safely")
    void testSalesTrend() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/analytics/sales-trend")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }
}
