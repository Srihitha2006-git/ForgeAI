package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.servlet.http.HttpServletRequest;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final OrderTrackingRepository orderTrackingRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    public PaymentController(UserRepository userRepository,
                             ProductRepository productRepository,
                             CartRepository cartRepository,
                             PaymentRepository paymentRepository,
                             OrderRepository orderRepository,
                             AddressRepository addressRepository,
                             OrderTrackingRepository orderTrackingRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.addressRepository = addressRepository;
        this.orderTrackingRepository = orderTrackingRepository;
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("authenticatedUserId");
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Long> payload, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }
        User user = optionalUser.get();

        // 1. Fetch Cart and validate
        Optional<Cart> optionalCart = cartRepository.findByUser(user);
        if (optionalCart.isEmpty() || optionalCart.get().getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Your cart is empty."));
        }
        Cart cart = optionalCart.get();

        // 2. Validate products, active status, stock, and calculate totals using DB pricing
        BigDecimal subtotal = BigDecimal.ZERO;
        StringBuilder cartSummary = new StringBuilder("ForgeAI Order: ");

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();

            // Verify active status
            if (product.getActive() == null || !product.getActive()) {
                return ResponseEntity.badRequest().body(createErrorResponse(product.getName() + " is currently unavailable."));
            }

            // Verify stock quantity
            if (item.getQuantity() > product.getStockQuantity()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Insufficient stock for " + product.getName() + ". Only " + product.getStockQuantity() + " available."));
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            cartSummary.append(product.getName()).append(" [x").append(item.getQuantity()).append("], ");
        }

        // Remove trailing comma and space
        if (cartSummary.length() > 15) {
            cartSummary.setLength(cartSummary.length() - 2);
        }

        BigDecimal shipping = BigDecimal.ZERO; // Free shipping by default
        BigDecimal total = subtotal.add(shipping);

        // Convert INR to paise
        long amountInPaise = total.multiply(BigDecimal.valueOf(100)).longValue();

        try {
            // Initialize Razorpay Client
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "FORGEAI_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));

            com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            // Load Delivery Address
            Long addressId = payload.get("addressId");
            if (addressId == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Address ID is required."));
            }
            Optional<Address> optionalAddress = addressRepository.findById(addressId);
            if (optionalAddress.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Address not found."));
            }
            Address address = optionalAddress.get();
            if (!address.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied: You do not own this address."));
            }

            // Persist payment record
            Payment payment = new Payment(
                    user,
                    cartSummary.toString(),
                    razorpayOrderId,
                    total,
                    "INR",
                    PaymentStatus.CREATED,
                    address
            );
            paymentRepository.save(payment);

            PaymentCreateOrderResponse response = new PaymentCreateOrderResponse(
                    razorpayOrderId,
                    razorpayKeyId,
                    amountInPaise,
                    "INR"
            );

            return ResponseEntity.ok(response);

        } catch (RazorpayException e) {
            // Return safe error message, log details locally without printing credentials
            System.err.println("Razorpay Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Failed to create payment order with Razorpay."));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("An internal error occurred."));
        }
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerifyRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        // 1. Find the payment record by razorpayOrderId
        Optional<Payment> optionalPayment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId());
        if (optionalPayment.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Payment order not found."));
        }
        Payment payment = optionalPayment.get();

        // 2. Security Check: Authenticated user ownership
        if (!payment.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Forbidden: You do not own this transaction."));
        }

        // 3. Check if an order already exists for this payment (Idempotency)
        Optional<Order> existingOrder = orderRepository.findByRazorpayOrderId(req.getRazorpayOrderId());
        if (existingOrder.isPresent()) {
            Map<String, Object> successResult = new HashMap<>();
            successResult.put("status", "SUCCESS");
            successResult.put("message", "Payment already verified.");
            successResult.put("orderId", existingOrder.get().getId());
            successResult.put("orderNumber", existingOrder.get().getOrderNumber());
            successResult.put("orderReference", payment.getRazorpayOrderId());
            return ResponseEntity.ok(successResult);
        }

        // 4. Double Payment Check: Check if this payment ID was already used for another order
        Optional<Order> orderWithPaymentId = orderRepository.findByRazorpayPaymentId(req.getRazorpayPaymentId());
        if (orderWithPaymentId.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Payment ID has already been processed for another order."));
        }

        try {
            // 5. Signature Verification
            String signatureData = payment.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId();
            String computedSignature = calculateHmacSha256(signatureData, razorpayKeySecret);

            boolean isSignatureValid = MessageDigest.isEqual(
                    computedSignature.getBytes(StandardCharsets.UTF_8),
                    req.getRazorpaySignature().getBytes(StandardCharsets.UTF_8)
            );

            if (!isSignatureValid) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Invalid payment signature."));
            }

            // 6. Update payment to VERIFIED
            payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
            payment.setRazorpaySignature(req.getRazorpaySignature());
            payment.setStatus(PaymentStatus.VERIFIED);
            paymentRepository.save(payment);

            // 7. Load user's cart
            Optional<Cart> optionalCart = cartRepository.findByUser(payment.getUser());
            if (optionalCart.isEmpty() || optionalCart.get().getItems().isEmpty()) {
                throw new RuntimeException("Your cart is empty. Cannot complete order.");
            }
            Cart cart = optionalCart.get();

            // 8. Create ForgeAI Order in PROCESSING state (since payment is already verified)
            String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            Order order = new Order(
                    payment.getUser(),
                    orderNumber,
                    payment.getAmount(),
                    payment.getCurrency(),
                    OrderStatus.PROCESSING,
                    payment.getRazorpayOrderId(),
                    req.getRazorpayPaymentId(),
                    payment.getDeliveryAddress()
            );

            // 9. Create OrderItems & Reduce stock safely
            for (CartItem item : cart.getItems()) {
                Product product = item.getProduct();

                // Validate product active and stock
                if (product.getActive() == null || !product.getActive()) {
                    throw new RuntimeException(product.getName() + " is currently unavailable.");
                }
                if (item.getQuantity() > product.getStockQuantity()) {
                    throw new RuntimeException("Insufficient stock for " + product.getName() + ". Only " + product.getStockQuantity() + " available.");
                }

                // Reduce stock
                int finalStock = product.getStockQuantity() - item.getQuantity();
                product.setStockQuantity(finalStock);
                productRepository.save(product);

                // Add OrderItem
                OrderItem orderItem = new OrderItem(
                        order,
                        product,
                        item.getQuantity(),
                        product.getPrice(),
                        product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                );
                order.getOrderItems().add(orderItem);
            }

            // Save Order (cascades saving of OrderItems)
            Order savedOrder = orderRepository.save(order);

            // Save tracking milestone history
            OrderTracking t1 = new OrderTracking(savedOrder, OrderStatus.PLACED, "Order placed successfully.");
            OrderTracking t2 = new OrderTracking(savedOrder, OrderStatus.CONFIRMED, "Payment successfully verified.");
            OrderTracking t3 = new OrderTracking(savedOrder, OrderStatus.PROCESSING, "Your order is being prepared.");
            orderTrackingRepository.saveAll(List.of(t1, t2, t3));

            // 10. Clear Cart
            cart.getItems().clear();
            cartRepository.save(cart);

            Map<String, Object> successResult = new HashMap<>();
            successResult.put("status", "SUCCESS");
            successResult.put("message", "Payment verified and order created successfully.");
            successResult.put("orderId", savedOrder.getId());
            successResult.put("orderNumber", savedOrder.getOrderNumber());
            successResult.put("orderReference", payment.getRazorpayOrderId());

            return ResponseEntity.ok(successResult);

        } catch (Exception e) {
            System.err.println("Verification Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Failed to verify payment."));
        }
    }

    private String calculateHmacSha256(String data, String secret) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] raw = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(raw);
    }
}
