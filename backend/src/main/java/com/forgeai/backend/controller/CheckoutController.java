package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;

    @Autowired
    public CheckoutController(UserRepository userRepository,
                              AddressRepository addressRepository,
                              CartRepository cartRepository) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.cartRepository = cartRepository;
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

    private AddressResponse convertToAddressResponse(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.getAddressType(),
                address.getIsDefault()
        );
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCheckout(@RequestBody CheckoutValidationRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        if (req.getAddressId() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Delivery address is required."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }
        User user = optionalUser.get();

        // 1. Load cart and verify it is not empty
        Optional<Cart> optionalCart = cartRepository.findByUser(user);
        if (optionalCart.isEmpty() || optionalCart.get().getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Your cart is empty."));
        }
        Cart cart = optionalCart.get();

        // 2. Load address and verify ownership
        Optional<Address> optionalAddress = addressRepository.findById(req.getAddressId());
        if (optionalAddress.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Address not found."));
        }
        Address address = optionalAddress.get();
        if (!address.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access: You do not own this address."));
        }

        // 3. Revalidate products, active status, stock, and calculate totals using DB pricing
        List<CheckoutItemResponse> checkoutItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

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

            checkoutItems.add(new CheckoutItemResponse(
                    product.getId(),
                    product.getName(),
                    product.getImageUrl(),
                    item.getQuantity(),
                    unitPrice,
                    itemSubtotal
            ));
        }

        // Calculate shipping and final total
        BigDecimal shipping = BigDecimal.ZERO; // Free shipping by default
        BigDecimal total = subtotal.add(shipping);

        CheckoutValidationResponse response = new CheckoutValidationResponse(
                convertToAddressResponse(address),
                checkoutItems,
                subtotal,
                shipping,
                total
        );

        return ResponseEntity.ok(response);
    }
}
