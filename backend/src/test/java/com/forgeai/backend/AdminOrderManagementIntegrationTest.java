package com.forgeai.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.dto.UpdateOrderStatusRequest;
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
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminOrderManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderTrackingRepository orderTrackingRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_ADMIN_EMAIL = "admin_order_mgmt@forgeai.com";
    private static final String TEST_ADMIN_PASSWORD = "Admin@ForgeAI2026!";
    private static final String TEST_CUSTOMER_EMAIL = "cust_order_mgmt@forgeai.com";
    private static final String TEST_CUSTOMER_PASSWORD = "CustomerPassword123!";

    private User testAdmin;
    private User testCustomer;
    private Address testAddress;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        Optional<User> existingAdmin = userRepository.findByEmail(TEST_ADMIN_EMAIL);
        if (existingAdmin.isEmpty()) {
            testAdmin = new User(
                    "Admin Order Manager",
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
                    "Customer Order Buyer",
                    TEST_CUSTOMER_EMAIL,
                    passwordEncoder.encode(TEST_CUSTOMER_PASSWORD),
                    Role.CUSTOMER
            );
            testCustomer = userRepository.save(testCustomer);
        } else {
            testCustomer = existingCustomer.get();
        }

        // Create or find default address
        List<Address> addresses = addressRepository.findByUserId(testCustomer.getId());
        if (addresses.isEmpty()) {
            testAddress = new Address(
                    testCustomer,
                    "Customer Order Buyer",
                    "9876543210",
                    "100 Cyber City",
                    "Tower A, Floor 5",
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

        // Create a test product
        String sku = "SKU-ORD-" + System.currentTimeMillis();
        testProduct = new Product(
                "Forge Neural Server Node",
                "High speed neural rack node",
                new BigDecimal("2999.00"),
                50,
                ProductCategory.OFFICE_ENTERPRISE,
                "ForgeAI",
                sku,
                null
        );
        testProduct.setActive(true);
        testProduct = productRepository.save(testProduct);

        Inventory inv = new Inventory(testProduct, 50, 10);
        inventoryRepository.save(inv);
    }

    @AfterEach
    void tearDown() {
        if (testCustomer != null) {
            List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(testCustomer);
            for (Order o : orders) {
                orderTrackingRepository.deleteAll(orderTrackingRepository.findByOrderOrderByCreatedAtAsc(o));
                orderRepository.delete(o);
            }
        }
        if (testProduct != null && testProduct.getId() != null) {
            inventoryRepository.deleteByProductId(testProduct.getId());
            productRepository.deleteById(testProduct.getId());
        }
    }

    private Order createTestOrder(OrderStatus initialStatus) {
        Order order = new Order();
        order.setUser(testCustomer);
        order.setDeliveryAddress(testAddress);
        order.setOrderNumber("ORD-TEST-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4));
        order.setStatus(initialStatus);
        order.setTotalAmount(new BigDecimal("2999.00"));
        order.setRazorpayOrderId("order_rp_" + System.currentTimeMillis());
        order.setRazorpayPaymentId("pay_rp_" + System.currentTimeMillis());
        order = orderRepository.save(order);

        OrderItem item = new OrderItem(order, testProduct, 1, new BigDecimal("2999.00"), new BigDecimal("2999.00"));
        orderItemRepository.save(item);

        OrderTracking initialTracking = new OrderTracking(order, initialStatus, "Order placed successfully.");
        orderTrackingRepository.save(initialTracking);

        return order;
    }

    @Test
    @DisplayName("Admin can view all orders from /api/admin/orders (200 OK)")
    void testAdminGetAllOrders() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        createTestOrder(OrderStatus.PENDING);

        mockMvc.perform(get("/api/admin/orders")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].id", notNullValue()))
                .andExpect(jsonPath("$[0].orderNumber", notNullValue()))
                .andExpect(jsonPath("$[0].customerName", notNullValue()))
                .andExpect(jsonPath("$[0].totalAmount", notNullValue()))
                .andExpect(jsonPath("$[0].status", notNullValue()));
    }

    @Test
    @DisplayName("Customer is denied access with 403 Forbidden on /api/admin/orders")
    void testCustomerDeniedAdminOrders() throws Exception {
        String customerToken = JwtUtil.generateToken(testCustomer.getId(), testCustomer.getEmail(), Role.CUSTOMER.name());

        mockMvc.perform(get("/api/admin/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request receives 401 Unauthorized on /api/admin/orders")
    void testUnauthenticatedDeniedAdminOrders() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin can search orders by orderNumber, customer name, or email")
    void testAdminSearchOrders() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        Order order = createTestOrder(OrderStatus.PENDING);

        // Search by orderNumber
        mockMvc.perform(get("/api/admin/orders?search=" + order.getOrderNumber())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderNumber", is(order.getOrderNumber())));

        // Search by customer email
        mockMvc.perform(get("/api/admin/orders?search=" + TEST_CUSTOMER_EMAIL)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Admin can filter orders by status")
    void testAdminFilterOrdersByStatus() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        createTestOrder(OrderStatus.PENDING);
        createTestOrder(OrderStatus.SHIPPED);

        mockMvc.perform(get("/api/admin/orders?status=PENDING")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status", anyOf(is("PENDING"), is("PLACED"))));
    }

    @Test
    @DisplayName("Admin can get complete order details by ID (200 OK)")
    void testAdminGetOrderDetails() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        Order order = createTestOrder(OrderStatus.PENDING);

        mockMvc.perform(get("/api/admin/orders/" + order.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(order.getId().intValue())))
                .andExpect(jsonPath("$.orderNumber", is(order.getOrderNumber())))
                .andExpect(jsonPath("$.customerName", is(testCustomer.getName())))
                .andExpect(jsonPath("$.customerEmail", is(testCustomer.getEmail())))
                .andExpect(jsonPath("$.deliveryAddress", notNullValue()))
                .andExpect(jsonPath("$.deliveryAddress.city", is("Bengaluru")))
                .andExpect(jsonPath("$.orderItems", isA(List.class)))
                .andExpect(jsonPath("$.orderItems[0].name", is(testProduct.getName())))
                .andExpect(jsonPath("$.statusHistory", isA(List.class)));
    }

    @Test
    @DisplayName("Getting non-existent order ID returns 404 Not Found")
    void testAdminGetOrderNotFound() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/orders/999999999")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("not found")));
    }

    @Test
    @DisplayName("Full Sequential Status Transition: PENDING → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED")
    void testFullSequentialStatusTransitions() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        Order order = createTestOrder(OrderStatus.PENDING);

        // 1. PENDING → CONFIRMED (TEST 8)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("CONFIRMED", "Order confirmed by admin."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // 2. CONFIRMED → PACKED (TEST 9)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("PACKED", "Items packed and ready for dispatch."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PACKED")));

        // 3. PACKED → SHIPPED (TEST 10)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("SHIPPED", "Package handed over to carrier."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")));

        // 4. SHIPPED → OUT_FOR_DELIVERY (TEST 11)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("OUT_FOR_DELIVERY", "Out for delivery with courier agent."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("OUT_FOR_DELIVERY")));

        // 5. OUT_FOR_DELIVERY → DELIVERED (TEST 12)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("DELIVERED", "Package received and signed by customer."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")));

        // 6. Verify status history preserves every single step (TEST 15)
        mockMvc.perform(get("/api/admin/orders/" + order.getId() + "/history")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(6)))
                .andExpect(jsonPath("$[?(@.status == 'DELIVERED')].previousStatus", hasItem("OUT_FOR_DELIVERY")));
    }

    @Test
    @DisplayName("Invalid status transition is rejected with 400 Bad Request (TEST 13)")
    void testInvalidStatusTransitionsRejected() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());
        Order order = createTestOrder(OrderStatus.PENDING);

        // 1. Invalid transition: PENDING directly to DELIVERED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("DELIVERED", "Skipping steps"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("error", notNullValue()));

        // 2. Deliver an order, then try to modify it back to CONFIRMED
        Order deliveredOrder = createTestOrder(OrderStatus.OUT_FOR_DELIVERY);
        orderService_forceDeliver(deliveredOrder);

        mockMvc.perform(patch("/api/admin/orders/" + deliveredOrder.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("CONFIRMED", "Attempting rollback"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("error", containsString("DELIVERED")));
    }

    @Test
    @DisplayName("Inventory Consistency: Cancelling an order restocks items without duplicates (TEST 16)")
    void testInventoryConsistencyOnCancellation() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        Product productForCancel = new Product(
                "Restock Monitor",
                "Testing restocking",
                new BigDecimal("500.00"),
                20,
                ProductCategory.OFFICE_ENTERPRISE,
                "ForgeAI",
                "SKU-RST-" + System.currentTimeMillis(),
                null
        );
        productForCancel.setActive(true);
        productForCancel = productRepository.save(productForCancel);

        Inventory inv = new Inventory(productForCancel, 20, 5);
        inv.setSoldStock(5);
        inventoryRepository.save(inv);

        // Create order with 2 units of productForCancel
        Order order = new Order();
        order.setUser(testCustomer);
        order.setDeliveryAddress(testAddress);
        order.setOrderNumber("ORD-CANCEL-" + System.currentTimeMillis());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setTotalAmount(new BigDecimal("1000.00"));
        order.setRazorpayOrderId("order_can_1");
        order.setRazorpayPaymentId("pay_can_1");
        order = orderRepository.save(order);

        OrderItem item = new OrderItem(order, productForCancel, 2, new BigDecimal("500.00"), new BigDecimal("1000.00"));
        orderItemRepository.save(item);
        order.setOrderItems(List.of(item));

        int availableBefore = inventoryRepository.findByProductId(productForCancel.getId()).get().getAvailableStock();

        // Cancel order
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("CANCELLED", "Customer requested cancellation"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Verify inventory increased by 2
        Inventory updatedInv = inventoryRepository.findByProductId(productForCancel.getId()).get();
        assertEquals(availableBefore + 2, updatedInv.getAvailableStock());

        // Attempting to cancel again should be rejected with 400 Bad Request
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest("CANCELLED", "Double cancellation"))))
                .andExpect(status().isBadRequest());

        // Verify stock was not restocked twice
        Inventory doubleCheckInv = inventoryRepository.findByProductId(productForCancel.getId()).get();
        assertEquals(availableBefore + 2, doubleCheckInv.getAvailableStock());
    }

    @Test
    @DisplayName("Phase 4D Product Management continues to work unaffected (TEST 17)")
    void testProductManagementUnaffected() throws Exception {
        String adminToken = JwtUtil.generateToken(testAdmin.getId(), testAdmin.getEmail(), Role.ADMIN.name());

        mockMvc.perform(get("/api/admin/products")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)));
    }

    private void orderService_forceDeliver(Order order) {
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);
    }
}
